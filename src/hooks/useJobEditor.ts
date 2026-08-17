import { useState } from 'react';
import { useDirtySnapshot } from './useDirtySnapshot';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile } from '../types/app';

const MAX_JOBS = 5;

export function useJobEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const dirty = useDirtySnapshot();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectionError, setSelectionError] = useState(false);

  const open = () => {
    const seed = userProfile?.jobs || [];
    setSelectedJobs(seed);
    dirty.capture(seed);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const toggleJob = (role: string) => {
    if (selectedJobs.includes(role)) {
      setSelectedJobs(selectedJobs.filter(j => j !== role));
      setSelectionError(false);
    } else if (selectedJobs.length < MAX_JOBS) {
      setSelectedJobs([...selectedJobs, role]);
      setSelectionError(false);
    } else {
      setSelectionError(true);
      setTimeout(() => setSelectionError(false), 3000);
    }
  };

  const removeJob = (role: string) => setSelectedJobs(selectedJobs.filter(j => j !== role));

  const clearSelection = () => setSelectedJobs([]);

  const toggleCategory = (category: string) => {
    setOpenCategory(prev => (prev === category ? null : category));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        jobs: selectedJobs,
      });

      setIsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isDirty: dirty.isDirty(selectedJobs),
    isEditOpen, open, close,
    selectedJobs, setSelectedJobs,
    openCategory, toggleCategory,
    jobSearchQuery, setJobSearchQuery,
    selectionError,
    toggleJob, removeJob, clearSelection,
    handleSave,
  };
}

export type JobEditor = ReturnType<typeof useJobEditor>;
