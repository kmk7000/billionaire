import { useState } from 'react';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { Publication } from '../types/app';

export function usePublicationEditor(user: FirebaseUser | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  const open = () => {
    setTitle('');
    setDate('');
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const openDatePicker = () => {
    setTempDate(
      date
        ? { year: parseInt(date.split('-')[0]), month: parseInt(date.split('-')[1]) }
        : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
    );
    setIsDatePickerOpen(true);
  };

  const clearDate = () => {
    setDate('');
    setIsDatePickerOpen(false);
  };

  const confirmDate = () => {
    setDate(`${tempDate.year}-${tempDate.month.toString().padStart(2, '0')}`);
    setIsDatePickerOpen(false);
  };

  const handleSave = async () => {
    if (!user || !title || !date) return;

    try {
      const newPublication: Publication = {
        id: Date.now().toString(),
        title,
        date,
      };

      await updateDoc(doc(db, 'users', user.uid), {
        publications: arrayUnion(newPublication),
      });

      setIsEditOpen(false);
      setTitle('');
      setDate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    // open() always blanks the form, so anything present is unsaved input.
    isDirty: !!title || !!date,
    isEditOpen, open, close,
    title, setTitle,
    date,
    isDatePickerOpen, setIsDatePickerOpen,
    tempDate, setTempDate,
    openDatePicker, clearDate, confirmDate,
    handleSave,
  };
}

export type PublicationEditor = ReturnType<typeof usePublicationEditor>;
