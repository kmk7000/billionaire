import { useEffect, useState } from 'react';
import { communityService } from '../services/firestoreService';
import { CommunityComment } from '../types/db';

export type SortedComment = CommunityComment & { replies: CommunityComment[] };

export function useCommunityComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = communityService.subscribeComments(postId, (data) => {
      setComments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const addComment = async (
    comment: Omit<CommunityComment, 'id' | 'likeCount' | 'status' | 'createdAt'>
  ) => {
    return communityService.addComment(comment);
  };

  // Group top-level comments with their one level of replies (parentId), like
  // Remember's comment thread — matches CommunityComment.parentId in src/types/db.ts.
  const threaded: SortedComment[] = comments
    .filter((c) => !c.parentId)
    .map((c) => ({
      ...c,
      replies: comments.filter((r) => r.parentId === c.id),
    }));

  return { comments, threaded, loading, addComment };
}
