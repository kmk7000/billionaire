import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { Article, UserProfile } from '../types/app';

export function useArticleEditor(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isListOpen, setIsListOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const resetForm = () => {
    setEditingArticleId(null);
    setTitle('');
    setUrl('');
  };

  const openList = () => setIsListOpen(true);
  const closeList = () => setIsListOpen(false);

  const openNew = () => {
    resetForm();
    setIsEditOpen(true);
  };

  const openExisting = (article: Article) => {
    setEditingArticleId(article.id);
    setTitle(article.title);
    setUrl(article.url);
    setIsEditOpen(true);
  };

  const close = () => setIsEditOpen(false);

  const isUrlValid = url.length === 0 || url.startsWith('http://') || url.startsWith('https://');

  const handleSave = async () => {
    if (!user || !title || !url) return;
    if (!isUrlValid) return;

    try {
      const updatedArticles = [...(userProfile?.articles || [])];

      if (editingArticleId) {
        const index = updatedArticles.findIndex(a => a.id === editingArticleId);
        if (index !== -1) {
          updatedArticles[index] = { ...updatedArticles[index], title, url };
        }
      } else {
        const newArticle: Article = {
          id: Date.now().toString(),
          title,
          url,
        };
        updatedArticles.push(newArticle);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        articles: updatedArticles,
      });

      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleDelete = async () => {
    if (!user || !editingArticleId) return;

    try {
      const updatedArticles = (userProfile?.articles || []).filter(a => a.id !== editingArticleId);

      await updateDoc(doc(db, 'users', user.uid), {
        articles: updatedArticles,
      });

      setIsDeleteModalOpen(false);
      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    articles: userProfile?.articles || [],
    isListOpen, openList, closeList,
    isEditOpen, openNew, openExisting, close,
    isDeleteModalOpen, setIsDeleteModalOpen,
    editingArticleId,
    title, setTitle,
    url, setUrl,
    isUrlValid,
    handleSave, handleDelete,
  };
}

export type ArticleEditor = ReturnType<typeof useArticleEditor>;
