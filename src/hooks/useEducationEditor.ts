import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { Education, UserProfile } from '../types/app';

export function useEducationEditor(
  user: FirebaseUser | null,
  userProfile: UserProfile | null,
  completedProfileSteps: number[],
  toggleProfileStep: (step: number) => void,
) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [major, setMajor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [isSchoolSearchOpen, setIsSchoolSearchOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [isMajorSearchOpen, setIsMajorSearchOpen] = useState(false);
  const [majorSearchQuery, setMajorSearchQuery] = useState('');
  const [isDegreeSelectOpen, setIsDegreeSelectOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState<'start' | 'end' | null>(null);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  const resetForm = () => {
    setSchool('');
    setDegree('');
    setMajor('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setDescription('');
  };

  const open = () => setIsEditOpen(true);
  const close = () => setIsEditOpen(false);

  const handleSave = async () => {
    if (!user || !school) return;

    try {
      const newEdu: Education = {
        id: Date.now().toString(),
        schoolName: school,
        degree,
        major,
        startDate,
        ...(isCurrent ? {} : { endDate }),
        isCurrent,
        description,
      };

      const updatedEdus = [...(userProfile?.educations || []), newEdu];

      await updateDoc(doc(db, 'users', user.uid), {
        educations: updatedEdus,
      });

      setIsEditOpen(false);
      if (!completedProfileSteps.includes(6)) {
        toggleProfileStep(6); // Mark education as completed
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const openYearPicker = (which: 'start' | 'end') => {
    const current = which === 'start' ? startDate : endDate;
    setTempYear(current ? parseInt(current) : new Date().getFullYear());
    setIsYearPickerOpen(which);
  };

  const clearYear = () => {
    if (isYearPickerOpen === 'start') setStartDate('');
    if (isYearPickerOpen === 'end') setEndDate('');
    setIsYearPickerOpen(null);
  };

  const confirmYear = () => {
    const formattedYear = tempYear.toString();
    if (isYearPickerOpen === 'start') setStartDate(formattedYear);
    if (isYearPickerOpen === 'end') setEndDate(formattedYear);
    setIsYearPickerOpen(null);
  };

  return {
    isEditOpen, open, close,
    school, setSchool,
    degree, setDegree,
    major, setMajor,
    startDate, setStartDate,
    endDate, setEndDate,
    isCurrent, setIsCurrent,
    description, setDescription,
    isSchoolSearchOpen, setIsSchoolSearchOpen,
    schoolSearchQuery, setSchoolSearchQuery,
    isMajorSearchOpen, setIsMajorSearchOpen,
    majorSearchQuery, setMajorSearchQuery,
    isDegreeSelectOpen, setIsDegreeSelectOpen,
    isYearPickerOpen, setIsYearPickerOpen,
    tempYear, setTempYear,
    handleSave,
    openYearPicker, clearYear, confirmYear,
  };
}

export type EducationEditor = ReturnType<typeof useEducationEditor>;
