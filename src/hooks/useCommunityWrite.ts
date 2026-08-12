import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { communityService } from '../services/firestoreService';
import type { UserProfile } from '../types/app';
import { generateAnonHandle } from '../utils/anonHandle';

export function useCommunityWrite(user: FirebaseUser | null, userProfile: UserProfile | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [boardId, setBoardId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = (initialBoardId?: string) => {
    setBoardId(initialBoardId && initialBoardId !== 'all' ? initialBoardId : '');
    setTitle('');
    setBody('');
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const canSubmit = !!boardId && title.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = async (): Promise<string | null> => {
    if (!user || !canSubmit) return null;

    setIsSubmitting(true);
    try {
      const jobTitle = userProfile?.jobs?.[0] || userProfile?.position;
      const authorLabel = userProfile?.jobs?.[0]
        ? userProfile.jobs[0]
        : userProfile?.position || '会社員';

      const newId = await communityService.createPost({
        boardId,
        authorId: user.uid,
        anonHandle: generateAnonHandle(jobTitle),
        authorLabel,
        companyVerified: false,
        title: title.trim(),
        body: body.trim(),
      });

      setIsOpen(false);
      setTitle('');
      setBody('');
      return newId;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen, open, close,
    boardId, setBoardId,
    title, setTitle,
    body, setBody,
    canSubmit, isSubmitting,
    handleSubmit,
  };
}

export type CommunityWrite = ReturnType<typeof useCommunityWrite>;
