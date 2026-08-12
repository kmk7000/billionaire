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
  // Get user's active digital cards
  async getMyCards(userId: string): Promise<DigitalCard[]> {
    try {
      const q = query(collection(db, 'my_cards'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DigitalCard[];
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.LIST, 'my_cards');
      return [];
    }
  },

  // Save / Update digital card
  async saveMyCard(card: Omit<DigitalCard, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    try {
      if (card.id) {
        const docRef = doc(db, 'my_cards', card.id);
        await updateDoc(docRef, {
          ...card,
          updatedAt: serverTimestamp(),
        });
        return card.id;
      } else {
        const docRef = await addDoc(collection(db, 'my_cards'), {
          ...card,
          viewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      }
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.WRITE, 'my_cards');
      throw error;
    }
  },

  // Fetch public digital card by handle
  async getCardByHandle(handle: string): Promise<DigitalCard | null> {
    try {
      const q = query(collection(db, 'my_cards'), where('handle', '==', handle), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const cardDoc = snap.docs[0];
      // Increment view count asynchronously
      updateDoc(doc(db, 'my_cards', cardDoc.id), {
        viewCount: increment(1),
      }).catch(() => {});
      return { id: cardDoc.id, ...cardDoc.data() } as DigitalCard;
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.GET, `my_cards/handle/${handle}`);
      return null;
    }
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
