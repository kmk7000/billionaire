import { useState, useEffect } from 'react';
import { communityService } from '../services/firestoreService';
import { CommunityPost } from '../types/db';

/**
 * `isEnabled` should be false until the user is signed in. The `posts` rules
 * require authentication, so subscribing on the login screen guarantees a
 * PERMISSION_DENIED for every visitor before they log in — noise that hides
 * real failures.
 */
export function useCommunityPosts(
  boardId: string = 'all',
  fallbackPosts: CommunityPost[] = [],
  isEnabled: boolean = true
) {
  const [posts, setPosts] = useState<CommunityPost[]>(fallbackPosts);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setPosts(fallbackPosts);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = communityService.subscribePosts(
      boardId,
      (realtimePosts) => {
        if (realtimePosts.length > 0) {
          setPosts(realtimePosts);
        } else {
          setPosts(fallbackPosts);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore community posts fallback:', err);
        setError(err);
        setPosts(fallbackPosts);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId, isEnabled]);

  const createPost = async (
    postData: Omit<CommunityPost, 'id' | 'likeCount' | 'commentCount' | 'viewCount' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const newId = await communityService.createPost(postData);
      return newId;
    } catch (err) {
      console.error('Failed to create community post:', err);
      // Fallback local update
      const tempId = `post_${Date.now()}`;
      const tempPost: CommunityPost = {
        ...postData,
        id: tempId,
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPosts((prev) => [tempPost, ...prev]);
      return tempId;
    }
  };

  const likePost = async (postId: string) => {
    try {
      await communityService.likePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p))
      );
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  return {
    posts,
    loading,
    error,
    createPost,
    likePost,
  };
}
