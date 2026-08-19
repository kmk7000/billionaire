import { useEffect, useState } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, deleteField,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, logFirestoreError, OperationType } from '../firebase';
import type { Meishi, MeishiGroup } from '../types/app';

// グループ機能 (名刺帳 folders). Mirrors how App.tsx talks to `meishi` directly
// with the Firestore SDK rather than going through firestoreService.ts — see
// CLAUDE.md's note that the latter is a separate, unused layer.
export function useMeishiGroups(uid: string | null) {
  const [groups, setGroups] = useState<MeishiGroup[]>([]);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      return;
    }
    const q = query(
      collection(db, 'meishi_groups'),
      where('ownerUid', '==', uid),
      orderBy('order', 'asc'),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MeishiGroup)));
    }, (error) => logFirestoreError(error, OperationType.LIST, 'meishi_groups'));

    return () => unsubscribe();
  }, [uid]);

  async function addGroup(name: string): Promise<void> {
    if (!uid) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await addDoc(collection(db, 'meishi_groups'), {
        ownerUid: uid,
        name: trimmed,
        // Date.now() rather than reading the current max order: appends to
        // the end without an extra round trip, and ties never matter here
        // since the list is small and user-reordered ties would be
        // indistinguishable anyway.
        order: Date.now(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'meishi_groups');
      throw error;
    }
  }

  async function renameGroup(groupId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateDoc(doc(db, 'meishi_groups', groupId), { name: trimmed });
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.UPDATE, `meishi_groups/${groupId}`);
      throw error;
    }
  }

  // Removing a group must not orphan its cards silently — Firestore rules
  // can't cascade, so the client clears `groupId` on every member card in
  // the same batch as the group delete. A batch keeps that atomic: either
  // every card is unfiled and the group is gone, or neither happened.
  async function deleteGroup(groupId: string, memberMeishis: Meishi[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      memberMeishis
        .filter((m) => m.groupId === groupId)
        .forEach((m) => batch.update(doc(db, 'meishi', m.id), { groupId: deleteField() }));
      batch.delete(doc(db, 'meishi_groups', groupId));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.DELETE, `meishi_groups/${groupId}`);
      throw error;
    }
  }

  return { groups, addGroup, renameGroup, deleteGroup };
}
