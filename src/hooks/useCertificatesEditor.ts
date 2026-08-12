import { useState } from 'react';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile } from '../types/app';

export function useCertificatesEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [certificatesList, setCertificatesList] = useState<string[]>(['']);

  const open = () => {
    setCertificatesList(userProfile?.certificates?.length ? userProfile.certificates : ['']);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const addCertificateInput = () => {
    setCertificatesList([...certificatesList, '']);
  };

  const changeCertificate = (index: number, value: string) => {
    const newCertificates = [...certificatesList];
    newCertificates[index] = value;
    setCertificatesList(newCertificates);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const validCertificates = certificatesList.filter(cert => cert.trim() !== '');

      await updateDoc(doc(db, 'users', user.uid), {
        certificates: validCertificates.length > 0 ? validCertificates : deleteField(),
      });

      setIsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    isEditOpen, open, close,
    certificatesList, addCertificateInput, changeCertificate,
    handleSave,
  };
}

export type CertificatesEditor = ReturnType<typeof useCertificatesEditor>;
