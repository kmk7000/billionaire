import { useState } from 'react';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile } from '../types/app';

export function useAwardsEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [awardsList, setAwardsList] = useState<string[]>(['']);

  const open = () => {
    setAwardsList(userProfile?.awards?.length ? userProfile.awards : ['']);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const addAwardInput = () => {
    setAwardsList([...awardsList, '']);
  };

  const changeAward = (index: number, value: string) => {
    const newAwards = [...awardsList];
    newAwards[index] = value;
    setAwardsList(newAwards);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const validAwards = awardsList.filter(award => award.trim() !== '');

      await updateDoc(doc(db, 'users', user.uid), {
        awards: validAwards.length > 0 ? validAwards : deleteField(),
      });

      setIsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isEditOpen, open, close,
    awardsList, addAwardInput, changeAward,
    handleSave,
  };
}

export type AwardsEditor = ReturnType<typeof useAwardsEditor>;
