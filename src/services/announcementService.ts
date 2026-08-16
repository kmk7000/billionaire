// Operator announcements (お知らせ).
//
// Written in the admin console, read by members. Queries filter on
// `isPublished` alone and sort in memory rather than combining `where` with
// `orderBy`, so no composite index has to exist before the feature works —
// the same tradeoff the admin queries make, and announcement volume is tiny.

import {
  collection, doc, addDoc, deleteDoc, getDocs, updateDoc,
  query, where, limit, serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, logFirestoreError, OperationType } from '../firebase';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  /** Set the first time it is published; drives ordering and the unread mark. */
  publishedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  authorUid?: string;
}

/** Newest first. Firestore Timestamps and ISO strings both sort correctly here. */
function byPublishedDesc(a: Announcement, b: Announcement): number {
  const toMs = (v: any) =>
    !v ? 0 : typeof v?.toDate === 'function' ? v.toDate().getTime() : new Date(v).getTime();
  return toMs(b.publishedAt || b.createdAt) - toMs(a.publishedAt || a.createdAt);
}

/** What members see. Published only — the rules enforce that too. */
export async function fetchPublishedAnnouncements(max: number = 50): Promise<Announcement[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'announcements'), where('isPublished', '==', true), limit(max))
    );
    const rows: Announcement[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    return rows.sort(byPublishedDesc);
  } catch (error) {
    // Callers render an empty state; a failure here must not take the app down.
    logFirestoreError(error, OperationType.LIST, 'announcements');
    return [];
  }
}

// --- Admin side -------------------------------------------------------------

export const adminAnnouncementService = {
  /** Everything, drafts included. */
  async list(max: number = 100): Promise<Announcement[]> {
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), limit(max)));
      const rows: Announcement[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return rows.sort(byPublishedDesc);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'announcements');
      throw error;
    }
  },

  async create(
    adminUid: string,
    input: { title: string; body: string; publish: boolean }
  ): Promise<string> {
    try {
      const ref = await addDoc(collection(db, 'announcements'), {
        title: input.title,
        body: input.body,
        isPublished: input.publish,
        authorUid: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(input.publish ? { publishedAt: serverTimestamp() } : {}),
      });
      return ref.id;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'announcements');
      throw error;
    }
  },

  async update(
    id: string,
    patch: { title?: string; body?: string; isPublished?: boolean; setPublishedAt?: boolean }
  ): Promise<void> {
    const { setPublishedAt, ...fields } = patch;
    try {
      await updateDoc(doc(db, 'announcements', id), {
        ...fields,
        updatedAt: serverTimestamp(),
        // Stamped only on the first publish, so editing a live announcement
        // does not shove it back to the top of everyone's list.
        ...(setPublishedAt ? { publishedAt: serverTimestamp() } : {}),
      });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `announcements/${id}`);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.DELETE, `announcements/${id}`);
      throw error;
    }
  },
};
