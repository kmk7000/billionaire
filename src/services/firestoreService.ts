// Firestore Service Layer for Billionaire (ビリオネア)
// Provides type-safe CRUD functions and handles errors gracefully

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  UserProfile,
  Employment,
  DigitalCard,
  ContactCard,
  CommunityPost,
  CommunityComment,
  ReportItem,
  UserBlock,
} from '../types/db';

// --- Contact Cards API (名刺管理) ---
export const contactService = {
  // Subscribe to user's saved contact cards
  subscribeContacts(
    ownerId: string,
    onData: (cards: ContactCard[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'contacts'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const cards: ContactCard[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ContactCard[];
        onData(cards);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'contacts');
        if (onError) onError(error);
      }
    );
  },

  // Save a new business card (OCR or Manual)
  async addContact(card: Omit<ContactCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const colRef = collection(db, 'contacts');
      const newDoc = await addDoc(colRef, {
        ...card,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDoc.id;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'contacts');
      throw error;
    }
  },

  // Update existing card
  async updateContact(id: string, card: Partial<ContactCard>): Promise<void> {
    try {
      const docRef = doc(db, 'contacts', id);
      await updateDoc(docRef, {
        ...card,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `contacts/${id}`);
      throw error;
    }
  },

  // Delete card
  async deleteContact(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'contacts', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.DELETE, `contacts/${id}`);
      throw error;
    }
  },
};

// --- Digital Cards API (マイ名刺) ---
export const digitalCardService = {
  // A user has exactly one digital card, stored under their own uid.
  async getMyCard(userId: string): Promise<DigitalCard | null> {
    try {
      const snap = await getDoc(doc(db, 'my_cards', userId));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as DigitalCard) : null;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.GET, `my_cards/${userId}`);
      return null;
    }
  },

  subscribeMyCard(
    userId: string,
    onData: (card: DigitalCard | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'my_cards', userId),
      (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as DigitalCard) : null),
      (error) => onError?.(error as Error)
    );
  },

  async saveMyCard(
    userId: string,
    card: Partial<Omit<DigitalCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, 'my_cards', userId),
        { ...card, userId, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.WRITE, `my_cards/${userId}`);
      throw error;
    }
  },

  // Resolve a public card from its handle. Runs for signed-out visitors, so
  // it must only ever touch documents the public rules allow.
  async getCardByHandle(handle: string): Promise<DigitalCard | null> {
    const normalized = normalizeHandle(handle);
    try {
      const reservation = await getDoc(doc(db, 'handles', normalized));
      if (!reservation.exists()) return null;

      const { uid } = reservation.data() as { uid: string };
      const cardSnap = await getDoc(doc(db, 'my_cards', uid));
      if (!cardSnap.exists()) return null;

      const card = { id: cardSnap.id, ...cardSnap.data() } as DigitalCard;
      if (!card.isPublic) return null;

      // Fire-and-forget: a failed counter bump must not break the page.
      updateDoc(doc(db, 'my_cards', uid), { viewCount: increment(1) }).catch(() => {});
      return card;
    } catch (error) {
      console.error('Failed to resolve card handle:', error);
      return null;
    }
  },
};

// --- Public handle reservations (@handle) ---

export const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/;

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

/** Handles that would collide with routes or impersonate the product. */
const RESERVED_HANDLES = new Set([
  'admin', 'billionaire', 'support', 'help', 'about', 'terms', 'privacy',
  'login', 'signup', 'settings', 'api', 'app', 'www', 'official', 'me',
]);

// A plain optional field rather than a discriminated union: this project's
// tsconfig has strictNullChecks off, which breaks narrowing on `ok`.
export interface HandleCheck {
  ok: boolean;
  reason?: 'format' | 'reserved' | 'taken';
}

export const handleService = {
  validateFormat(handle: string): HandleCheck {
    const normalized = normalizeHandle(handle);
    if (!HANDLE_PATTERN.test(normalized)) return { ok: false, reason: 'format' };
    if (RESERVED_HANDLES.has(normalized)) return { ok: false, reason: 'reserved' };
    return { ok: true };
  },

  /** Format check plus a lookup for whether someone else already holds it. */
  async check(handle: string, currentUid?: string): Promise<HandleCheck> {
    const format = handleService.validateFormat(handle);
    if (!format.ok) return format;

    const normalized = normalizeHandle(handle);
    const snap = await getDoc(doc(db, 'handles', normalized));
    if (snap.exists() && (snap.data() as { uid: string }).uid !== currentUid) {
      return { ok: false, reason: 'taken' };
    }
    return { ok: true };
  },

  /**
   * Reserve a handle for a user. `create` is rejected by the security rules
   * when the document already exists, so two users racing for the same
   * handle cannot both succeed.
   */
  async claim(handle: string, uid: string, previousHandle?: string): Promise<HandleCheck> {
    const normalized = normalizeHandle(handle);
    const format = handleService.validateFormat(normalized);
    if (!format.ok) return format;

    if (previousHandle && normalizeHandle(previousHandle) === normalized) {
      return { ok: true };
    }

    try {
      await setDoc(doc(db, 'handles', normalized), {
        uid,
        cardId: uid,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Either someone else holds it, or the rules rejected an overwrite.
      return { ok: false, reason: 'taken' };
    }

    if (previousHandle) {
      await deleteDoc(doc(db, 'handles', normalizeHandle(previousHandle))).catch(() => {});
    }
    return { ok: true };
  },

  async release(handle: string): Promise<void> {
    await deleteDoc(doc(db, 'handles', normalizeHandle(handle))).catch(() => {});
  },
};

// --- Community API (匿名コミュニティ) ---
export const communityService = {
  // Subscribe to board posts
  subscribePosts(
    boardId: string,
    onData: (posts: CommunityPost[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    let q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (boardId !== 'all') {
      q = query(
        collection(db, 'posts'),
        where('boardId', '==', boardId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    return onSnapshot(
      q,
      (snap) => {
        const posts: CommunityPost[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CommunityPost[];
        onData(posts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
        if (onError) onError(error);
      }
    );
  },

  // Create post
  async createPost(post: Omit<CommunityPost, 'id' | 'likeCount' | 'commentCount' | 'viewCount' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const colRef = collection(db, 'posts');
      const newDoc = await addDoc(colRef, {
        ...post,
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDoc.id;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'posts');
      throw error;
    }
  },

  // Fetch a single post (for the detail overlay)
  async getPost(postId: string): Promise<CommunityPost | null> {
    try {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as CommunityPost;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.GET, `posts/${postId}`);
      throw error;
    }
  },

  // Increment view count (fire-and-forget, called once per detail-view open)
  async incrementView(postId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'posts', postId), { viewCount: increment(1) });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `posts/${postId}`);
    }
  },

  // Subscribe to comments
  subscribeComments(
    postId: string,
    onData: (comments: CommunityComment[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snap) => {
      const comments = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityComment[];
      onData(comments);
    });
  },

  // Add comment
  async addComment(comment: Omit<CommunityComment, 'id' | 'likeCount' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const colRef = collection(db, 'comments');
      const newDoc = await addDoc(colRef, {
        ...comment,
        likeCount: 0,
        status: 'published',
        createdAt: serverTimestamp(),
      });

      // Increment post comment count
      const postRef = doc(db, 'posts', comment.postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
      });

      return newDoc.id;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'comments');
      throw error;
    }
  },

  // Like post
  async likePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likeCount: increment(1),
      });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `posts/${postId}`);
    }
  },
};

// --- Safety & Moderation API (신고 및 차단) ---
export const safetyService = {
  // Create report (24-hour SLA tracking)
  async submitReport(report: Omit<ReportItem, 'id' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const colRef = collection(db, 'reports');
      const newDoc = await addDoc(colRef, {
        ...report,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      return newDoc.id;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'reports');
      throw error;
    }
  },

  // Block user
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      const blockId = `${blockerId}_${blockedId}`;
      const docRef = doc(db, 'blocks', blockId);
      await setDoc(docRef, {
        blockerId,
        blockedId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, `blocks/${blockerId}_${blockedId}`);
      throw error;
    }
  },
};
