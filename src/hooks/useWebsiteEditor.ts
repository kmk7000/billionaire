import { useState } from 'react';
import { useDirtySnapshot } from './useDirtySnapshot';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile } from '../types/app';

export function useWebsiteEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const dirty = useDirtySnapshot();
  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);

  const open = () => {
    const seed = userProfile?.websites?.length ? userProfile.websites : [''];
    setWebsiteUrls(seed);
    dirty.capture(seed);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const addUrlInput = () => {
    setWebsiteUrls([...websiteUrls, '']);
  };

  const changeUrl = (index: number, value: string) => {
    const newUrls = [...websiteUrls];
    newUrls[index] = value;
    setWebsiteUrls(newUrls);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const validUrls = websiteUrls.filter(url => url.trim() !== '');
      await updateDoc(doc(db, 'users', user.uid), {
        websites: validUrls,
      });

      setIsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isDirty: dirty.isDirty(websiteUrls),
    isEditOpen, open, close,
    websiteUrls, addUrlInput, changeUrl,
    handleSave,
  };
}

export type WebsiteEditor = ReturnType<typeof useWebsiteEditor>;
