import { useState, useEffect } from 'react';
import { contactService } from '../services/firestoreService';
import { ContactCard } from '../types/db';

export function useContactsData(userId: string | null, mockFallbackCards: ContactCard[] = []) {
  const [contacts, setContacts] = useState<ContactCard[]>(mockFallbackCards);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setContacts(mockFallbackCards);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = contactService.subscribeContacts(
      userId,
      (fetchedCards) => {
        if (fetchedCards.length > 0) {
          setContacts(fetchedCards);
        } else {
          // If user has no cards in firestore yet, keep fallback mock or empty
          setContacts(mockFallbackCards);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore contacts subscription fallback to local state:', err);
        setError(err);
        setContacts(mockFallbackCards);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addContact = async (card: Omit<ContactCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (userId) {
        const id = await contactService.addContact({ ...card, ownerId: userId });
        return id;
      } else {
        // Fallback local addition if user not logged in
        const tempId = `temp_${Date.now()}`;
        const newCard = { ...card, id: tempId, ownerId: 'guest', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setContacts((prev) => [newCard as ContactCard, ...prev]);
        return tempId;
      }
    } catch (err) {
      console.error('Failed to add contact card:', err);
      throw err;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      if (userId && !id.startsWith('temp_')) {
        await contactService.deleteContact(id);
      } else {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
      throw err;
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    deleteContact,
  };
}
