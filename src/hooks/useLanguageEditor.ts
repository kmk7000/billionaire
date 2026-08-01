import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { Language, UserProfile } from '../types/app';

export function useLanguageEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = useState(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedLanguage('');
    setSelectedLevel('');
    setEditingLanguageId(null);
  };

  const openNew = () => {
    resetForm();
    setIsEditOpen(true);
  };

  const openExisting = (lang: Language) => {
    setSelectedLanguage(lang.language);
    setSelectedLevel(lang.level);
    setEditingLanguageId(lang.id);
    setIsEditOpen(true);
  };

  const close = () => {
    setIsEditOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!user || !selectedLanguage || !selectedLevel) return;

    try {
      const currentLanguages = userProfile?.languages || [];
      let updatedLanguages;

      if (editingLanguageId) {
        updatedLanguages = currentLanguages.map(lang =>
          lang.id === editingLanguageId
            ? { ...lang, language: selectedLanguage, level: selectedLevel }
            : lang
        );
      } else {
        updatedLanguages = [
          ...currentLanguages,
          {
            id: Date.now().toString(),
            language: selectedLanguage,
            level: selectedLevel,
          },
        ];
      }

      await updateDoc(doc(db, 'users', user.uid), {
        languages: updatedLanguages,
      });

      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const deleteLanguage = async (id: string) => {
    if (!user || !userProfile?.languages) return;

    try {
      const updatedLanguages = userProfile.languages.filter(lang => lang.id !== id);
      await updateDoc(doc(db, 'users', user.uid), {
        languages: updatedLanguages,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isEditOpen, openNew, openExisting, close,
    selectedLanguage, setSelectedLanguage,
    selectedLevel, setSelectedLevel,
    isLanguageSelectOpen, setIsLanguageSelectOpen,
    isLevelSelectOpen, setIsLevelSelectOpen,
    editingLanguageId,
    handleSave, deleteLanguage,
  };
}

export type LanguageEditor = ReturnType<typeof useLanguageEditor>;
