import React, { useMemo, useState } from 'react';
import { PenSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Fab } from '../components/layout/Fab';
import type { CommunityPost } from '../types/db';
import { BoardChipBar } from '../components/community/BoardChipBar';
import { BestPostsSection } from '../components/community/BestPostsSection';
import { PostCard } from '../components/community/PostCard';
import { PostCardSkeleton } from '../components/community/PostCardSkeleton';
import { RecommendedSidebar } from '../components/community/RecommendedSidebar';

type FeedMode = 'feed' | 'best' | 'recommended';

interface CommunityScreenProps {
  posts: CommunityPost[];
  loading?: boolean;
  selectedBoard: string;
  onSelectBoard: (boardId: string) => void;
  onSelectPost: (postId: string) => void;
  onOpenWrite: () => void;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({
  posts, loading = false, selectedBoard, onSelectBoard, onSelectPost, onOpenWrite,
}) => {
  const [feedMode, setFeedMode] = useState<FeedMode>('feed');

  const filteredPosts = useMemo(
    () => (selectedBoard === 'all' ? posts : posts.filter((p) => p.boardId === selectedBoard)),
    [posts, selectedBoard]
  );

  return (
    <motion.div
      key="forum"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative pb-16"
    >
      <div className="lg:hidden">
        <BoardChipBar selectedBoard={selectedBoard} onSelectBoard={onSelectBoard} />
      </div>

      <BestPostsSection
        posts={filteredPosts}
        count={2}
        showViewAll={feedMode !== 'best'}
        onViewAll={() => setFeedMode('best')}
        onSelectPost={onSelectPost}
        loading={loading}
      />

      <div className="flex border-b border-line bg-surface lg:hidden">
        <button
          onClick={() => setFeedMode('feed')}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors duration-200 ${
            feedMode === 'feed' ? 'text-ink border-b-2 border-ink' : 'text-ink-faint'
          }`}
        >
          新着投稿
        </button>
        <button
          onClick={() => setFeedMode('recommended')}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors duration-200 ${
            feedMode === 'recommended' ? 'text-ink border-b-2 border-ink' : 'text-ink-faint'
          }`}
        >
          推薦投稿
        </button>
      </div>

      {feedMode === 'recommended' ? (
        <div className="p-3 lg:hidden">
          <RecommendedSidebar posts={filteredPosts} onSelectPost={onSelectPost} inline />
        </div>
      ) : (
        <div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-sm text-ink-faint py-16">まだ投稿がありません</p>
          ) : (
            (feedMode === 'best' ? [...filteredPosts].sort((a, b) => b.likeCount - a.likeCount) : filteredPosts).map((post) => (
              <PostCard key={post.id} post={post} onSelect={onSelectPost} />
            ))
          )}
        </div>
      )}

      <Fab onClick={onOpenWrite} ariaLabel="投稿を作成" shape="circle">
        <PenSquare className="w-5 h-5" />
      </Fab>
    </motion.div>
  );
};
