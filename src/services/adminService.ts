// Operator-side data access for the in-app admin console.
//
// Every read here relies on `isAdmin()` in firestore.rules, which resolves to
// `users/{uid}.role == 'admin'`. A non-admin account gets PERMISSION_DENIED on
// the very first list, which is exactly the intended behaviour — the console is
// gated on the client too, but the rules are what actually enforce it.
//
// Deliberately absent: any listing of the `meishi` collection. Those documents
// hold the contact details of third parties who handed a card to a user and
// never agreed to the operator browsing them. The rules technically allow an
// admin to read them; the product should not.
//
// Queries here avoid `where` + `orderBy` combinations on purpose so that no
// composite index has to be created before the console works. Volumes are small
// (support tickets and reports), so the filtering happens client-side.

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  getCountFromServer,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { CommunityComment, CommunityPost, ReportItem } from '../types/db';

/** How many documents each tab pulls. Small enough for one screenful of work. */
export const ADMIN_PAGE_SIZE = 200;

export type InquiryStatus = 'open' | 'in_progress' | 'resolved';
export type ReportStatus = ReportItem['status']; // open | reviewing | actioned | dismissed
export type ContentStatus = CommunityPost['status']; // published | held | hidden | deleted

export interface AdminInquiry {
  id: string;
  userId: string;
  email: string;
  body: string;
  attachmentCount: number;
  status: InquiryStatus;
  adminNote?: string;
  handledBy?: string;
  handledAt?: any;
  createdAt: any;
}

export interface AdminUserRow {
  uid: string;
  email: string;
  displayName?: string;
  company?: string;
  position?: string;
  role: string;
  createdAt: any;
}

export interface AdminStats {
  users: number;
  posts: number;
  comments: number;
  inquiries: number;
  reports: number;
}

/** Firestore rejects `undefined`, and these patches are built from optional UI fields. */
function stripUndefined(patch: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(patch).forEach((key) => {
    if (patch[key] !== undefined) clean[key] = patch[key];
  });
  return clean;
}

// --- Audit trail ------------------------------------------------------------
//
// Every view of a case's private contents (an inquiry's screenshots, a
// reported member's post) and every mutation an operator makes is recorded
// here, unprompted — this is the practice Remember itself uses: "승인된
// 인원만 명함 데이터 접근 권한 보유... 모든 조회 활동이 기록되고 실시간
// 모니터링". With one operator this collection is inert. The moment a second
// one is added, it is what lets anyone answer "who looked at this" and "who
// changed that" without having to ask.
//
// Entries are append-only: firestore.rules grants `create` to any admin but
// no `update` or `delete` on this collection, on purpose. If a logged action
// turns out to be wrong, the fix is a new corrective action, not a rewritten
// history.

export type AdminAuditAction =
  | 'inquiry_view' | 'inquiry_status' | 'inquiry_note'
  | 'report_view' | 'report_status' | 'report_note'
  | 'post_hide' | 'post_restore' | 'comment_hide' | 'comment_restore';

export type AdminAuditTarget = 'inquiry' | 'report' | 'post' | 'comment';

export interface AdminAuditEntry {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: AdminAuditAction;
  targetType: AdminAuditTarget;
  targetId: string;
  detail?: string;
  createdAt: any;
}

/**
 * Fire-and-forget by design: an audit write must never block or fail the
 * operator's actual action, and its latency must never be felt in the UI.
 */
function writeAudit(
  action: AdminAuditAction,
  targetType: AdminAuditTarget,
  targetId: string,
  detail?: string
): void {
  const admin = auth.currentUser;
  if (!admin) return;
  addDoc(collection(db, 'admin_audit'), {
    adminUid: admin.uid,
    adminEmail: admin.email || '',
    action,
    targetType,
    targetId,
    ...(detail ? { detail } : {}),
    createdAt: serverTimestamp(),
  }).catch(() => {
    // A missed audit entry should not surface as an error to the operator —
    // the primary action already succeeded by the time this runs.
  });
}

export const adminAuditService = {
  async list(max: number = 200): Promise<AdminAuditEntry[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'admin_audit'), orderBy('createdAt', 'desc'), limit(max))
      );
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'admin_audit');
      throw error;
    }
  },
};

// --- Inquiries (1:1 お問い合わせ) -----------------------------------------

export const adminInquiryService = {
  async list(max: number = ADMIN_PAGE_SIZE): Promise<AdminInquiry[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(max))
      );
      const rows: AdminInquiry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      return rows;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'inquiries');
      throw error;
    }
  },

  /** Screenshots live one-per-document, so they are only fetched when a case is opened. */
  async attachments(inquiryId: string): Promise<string[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'inquiries', inquiryId, 'attachments'), orderBy('order', 'asc'))
      );
      return snap.docs.map((d) => (d.data() as any).dataUrl as string).filter(Boolean);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, `inquiries/${inquiryId}/attachments`);
      return [];
    }
  },

  async update(
    inquiryId: string,
    adminUid: string,
    patch: { status?: InquiryStatus; adminNote?: string }
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'inquiries', inquiryId),
        stripUndefined({ ...patch, handledBy: adminUid, handledAt: serverTimestamp() })
      );
      if (patch.status) writeAudit('inquiry_status', 'inquiry', inquiryId, `→ ${patch.status}`);
      if (patch.adminNote !== undefined) writeAudit('inquiry_note', 'inquiry', inquiryId);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `inquiries/${inquiryId}`);
      throw error;
    }
  },

  /** Call once when a case's contents (body, screenshots) are opened. */
  logView(inquiryId: string): void {
    writeAudit('inquiry_view', 'inquiry', inquiryId);
  },
};

// --- Reports (通報) --------------------------------------------------------

export interface AdminReport extends ReportItem {
  adminNote?: string;
}

export const adminReportService = {
  async list(max: number = ADMIN_PAGE_SIZE): Promise<AdminReport[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(max))
      );
      const rows: AdminReport[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      return rows;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'reports');
      throw error;
    }
  },

  async update(
    reportId: string,
    adminUid: string,
    patch: { status?: ReportStatus; adminNote?: string }
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'reports', reportId),
        stripUndefined({ ...patch, handledBy: adminUid, handledAt: serverTimestamp() })
      );
      if (patch.status) writeAudit('report_status', 'report', reportId, `→ ${patch.status}`);
      if (patch.adminNote !== undefined) writeAudit('report_note', 'report', reportId);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `reports/${reportId}`);
      throw error;
    }
  },

  /** Call once when a report's target content is fetched and displayed. */
  logView(reportId: string): void {
    writeAudit('report_view', 'report', reportId);
  },

  /**
   * Loads whatever a report points at so the moderator can judge it in context
   * instead of acting on an ID. Returns null for target types that have no
   * fetchable document (a reported user, for instance).
   */
  async loadTarget(
    targetType: ReportItem['targetType'],
    targetId: string
  ): Promise<{ kind: 'post'; post: CommunityPost } | { kind: 'comment'; comment: CommunityComment } | null> {
    try {
      if (targetType === 'post') {
        const snap = await getDoc(doc(db, 'posts', targetId));
        if (!snap.exists()) return null;
        return { kind: 'post', post: { id: snap.id, ...(snap.data() as any) } as CommunityPost };
      }
      if (targetType === 'comment') {
        const snap = await getDoc(doc(db, 'comments', targetId));
        if (!snap.exists()) return null;
        return { kind: 'comment', comment: { id: snap.id, ...(snap.data() as any) } as CommunityComment };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.GET, `${targetType}s/${targetId}`);
      return null;
    }
  },
};

// --- Community moderation --------------------------------------------------

export const adminContentService = {
  /** Recent posts across every board, including ones already hidden. */
  async listPosts(max: number = 100): Promise<CommunityPost[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max))
      );
      const rows: CommunityPost[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as CommunityPost[];
      return rows;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'posts');
      throw error;
    }
  },

  async listComments(max: number = 100): Promise<CommunityComment[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'comments'), orderBy('createdAt', 'desc'), limit(max))
      );
      const rows: CommunityComment[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as CommunityComment[];
      return rows;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'comments');
      throw error;
    }
  },

  /**
   * Soft-hide rather than delete. `status` already drives every reader query
   * (`where('status', '==', 'published')`), so flipping it removes the content
   * from the feed while keeping it available if the decision is appealed.
   */
  async setPostStatus(postId: string, status: ContentStatus): Promise<void> {
    try {
      await updateDoc(doc(db, 'posts', postId), { status, updatedAt: serverTimestamp() });
      writeAudit(status === 'published' ? 'post_restore' : 'post_hide', 'post', postId, `→ ${status}`);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `posts/${postId}`);
      throw error;
    }
  },

  async setCommentStatus(commentId: string, status: ContentStatus): Promise<void> {
    try {
      await updateDoc(doc(db, 'comments', commentId), { status });
      writeAudit(
        status === 'published' ? 'comment_restore' : 'comment_hide',
        'comment',
        commentId,
        `→ ${status}`
      );
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `comments/${commentId}`);
      throw error;
    }
  },
};

// --- Users -----------------------------------------------------------------

export const adminUserService = {
  /** Newest accounts first. Capped — this is a support tool, not an export. */
  async listRecent(max: number = 50): Promise<AdminUserRow[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max))
      );
      const rows: AdminUserRow[] = snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      }));
      return rows;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'users');
      throw error;
    }
  },

  /** Exact-match lookup: Firestore has no substring search. */
  async findByEmail(email: string): Promise<AdminUserRow | null> {
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()), limit(1))
      );
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { uid: d.id, ...(d.data() as any) };
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'users');
      return null;
    }
  },

  async getByUid(uid: string): Promise<AdminUserRow | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      return { uid: snap.id, ...(snap.data() as any) };
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },
};

// --- Overview counters -----------------------------------------------------

/**
 * Server-side aggregation: one billed read per 1,000 documents instead of
 * downloading the collections. A failed count degrades to -1 rather than
 * taking the whole dashboard down.
 */
async function safeCount(path: string): Promise<number> {
  try {
    const snap = await getCountFromServer(collection(db, path));
    return snap.data().count;
  } catch {
    return -1;
  }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [users, posts, comments, inquiries, reports] = await Promise.all([
    safeCount('users'),
    safeCount('posts'),
    safeCount('comments'),
    safeCount('inquiries'),
    safeCount('reports'),
  ]);
  return { users, posts, comments, inquiries, reports };
}
