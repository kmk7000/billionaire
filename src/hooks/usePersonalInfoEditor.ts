import { useState } from 'react';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile } from '../types/app';

type Gender = '男性' | '女性' | '選択しない';

export function usePersonalInfoEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [birthYear, setBirthYear] = useState<number | undefined>(undefined);

  const open = () => {
    setGender(userProfile?.gender);
    setBirthYear(userProfile?.birthYear);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const isUnchanged = gender === userProfile?.gender && birthYear === userProfile?.birthYear;

  const handleSave = async () => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (gender !== undefined) updateData.gender = gender || deleteField();
      if (birthYear !== undefined) updateData.birthYear = birthYear || deleteField();

      await updateDoc(doc(db, 'users', user.uid), updateData);

      setIsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isEditOpen, open, close,
    gender, setGender,
    birthYear, setBirthYear,
    isUnchanged,
    handleSave,
  };
}

export type PersonalInfoEditor = ReturnType<typeof usePersonalInfoEditor>;
