import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { Career, UserProfile } from '../types/app';
import { PREFECTURES } from '../constants/profileData';

export function calculateCareerDuration(startDate: string, endDate?: string, isCurrent?: boolean) {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = isCurrent || !endDate ? new Date() : new Date(endDate);

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  months += 1; // Include both start and end months

  if (months < 1) return '0ヶ月';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths}ヶ月`;
  if (remainingMonths === 0) return `${years}年`;
  return `${years}年 ${remainingMonths}ヶ月`;
}

export function useCareerEditor(
  user: FirebaseUser | null,
  userProfile: UserProfile | null,
  completedProfileSteps: number[],
  toggleProfileStep: (step: number) => void,
) {
  const [isListOpen, setIsListOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCompanySearchOpen, setIsCompanySearchOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<'start' | 'end' | null>(null);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [totalCareerYears, setTotalCareerYears] = useState('');
  const [company, setCompany] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [locationRegion, setLocationRegion] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [tempDate, setTempDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  useEffect(() => {
    if (isListOpen && userProfile) {
      setTotalCareerYears(userProfile.totalCareerYears || '');
    }
  }, [isListOpen, userProfile]);

  const resetForm = () => {
    setCompany('');
    setIsCurrent(false);
    setStartDate('');
    setEndDate('');
    setTitle('');
    setDepartment('');
    setDescription('');
    setLocationRegion('');
    setLocationCountry('');
  };

  const openList = () => setIsListOpen(true);
  const closeList = () => setIsListOpen(false);

  const openNewCareer = () => {
    setEditingCareerId(null);
    resetForm();
    setIsEditOpen(true);
  };

  const openExistingCareer = (career: Career) => {
    setEditingCareerId(career.id);
    setCompany(career.companyName);
    setIsCurrent(career.isCurrent);
    setStartDate(career.startDate);
    setEndDate(career.endDate || '');
    setTitle(career.title || '');
    setDepartment(career.department || '');
    setDescription(career.description || '');
    const loc = career.location || '';
    if (PREFECTURES.includes(loc)) {
      setLocationRegion(loc);
      setLocationCountry('');
    } else if (loc) {
      setLocationRegion('海外');
      setLocationCountry(loc);
    } else {
      setLocationRegion('');
      setLocationCountry('');
    }
    setIsEditOpen(true);
  };

  const handleSaveTotalCareerYears = async (years: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { totalCareerYears: years });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveCareer = async () => {
    if (!user || !company || !startDate) return;
    if (!isCurrent && !endDate) return;

    try {
      const careerData: Career = {
        id: editingCareerId || Date.now().toString(),
        companyName: company,
        isCurrent,
        startDate,
        ...(isCurrent ? {} : { endDate }),
        title,
        department,
        description,
        location: locationRegion === '海外' ? locationCountry : locationRegion,
      };

      let updatedCareers = userProfile?.careers || [];
      if (editingCareerId) {
        updatedCareers = updatedCareers.map(c => c.id === editingCareerId ? careerData : c);
      } else {
        updatedCareers = [...updatedCareers, careerData];
      }

      await updateDoc(doc(db, 'users', user.uid), { careers: updatedCareers });

      setIsEditOpen(false);
      setEditingCareerId(null);
      if (!completedProfileSteps.includes(3)) {
        toggleProfileStep(3); // Mark career as completed
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleDeleteCareer = async () => {
    if (!user || !editingCareerId) return;
    try {
      const updatedCareers = userProfile?.careers?.filter(c => c.id !== editingCareerId) || [];
      await updateDoc(doc(db, 'users', user.uid), { careers: updatedCareers });

      setIsEditOpen(false);
      setEditingCareerId(null);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const openDatePicker = (which: 'start' | 'end') => {
    const current = which === 'start' ? startDate : endDate;
    setTempDate(
      current
        ? { year: parseInt(current.split('-')[0]), month: parseInt(current.split('-')[1]) }
        : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
    );
    setIsDatePickerOpen(which);
  };

  const clearDate = () => {
    if (isDatePickerOpen === 'start') setStartDate('');
    if (isDatePickerOpen === 'end') setEndDate('');
    setIsDatePickerOpen(null);
  };

  const confirmDate = () => {
    const formattedDate = `${tempDate.year}-${tempDate.month.toString().padStart(2, '0')}`;
    if (isDatePickerOpen === 'start') setStartDate(formattedDate);
    if (isDatePickerOpen === 'end') setEndDate(formattedDate);
    setIsDatePickerOpen(null);
  };

  return {
    careers: userProfile?.careers || [],
    isListOpen, openList, closeList,
    isEditOpen, setIsEditOpen,
    isCompanySearchOpen, setIsCompanySearchOpen,
    isDatePickerOpen, setIsDatePickerOpen,
    editingCareerId,
    totalCareerYears, setTotalCareerYears, handleSaveTotalCareerYears,
    company, setCompany,
    isCurrent, setIsCurrent,
    startDate, setStartDate,
    endDate, setEndDate,
    title, setTitle,
    department, setDepartment,
    description, setDescription,
    locationRegion, setLocationRegion,
    locationCountry, setLocationCountry,
    companySearchQuery, setCompanySearchQuery,
    tempDate, setTempDate,
    openNewCareer, openExistingCareer,
    handleSaveCareer, handleDeleteCareer,
    openDatePicker, clearDate, confirmDate,
  };
}

export type CareerEditor = ReturnType<typeof useCareerEditor>;
