import { useState } from 'react';
import { useDirtySnapshot } from './useDirtySnapshot';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile } from '../types/app';

export function useSkillEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const dirty = useDirtySnapshot();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  const open = () => {
    const seed = userProfile?.skills || [];
    setSelectedSkills(seed);
    dirty.capture(seed);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const clearSelection = () => setSelectedSkills([]);

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        skills: selectedSkills,
      });

      setIsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isDirty: dirty.isDirty(selectedSkills),
    isEditOpen, open, close,
    selectedSkills, setSelectedSkills,
    skillSearchQuery, setSkillSearchQuery,
    toggleSkill, clearSelection,
    handleSave,
  };
}

export type SkillEditor = ReturnType<typeof useSkillEditor>;
