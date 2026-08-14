import React, { useMemo } from 'react';
import { Trophy, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import type { CommunityPost } from '../../types/db';
import { getCommunityBoardLabel } from '../../constants/communityBoards';
import { BestPostRowSkeleton } from './PostCardSkeleton';

interface BestPostsSectionProps {
  posts: CommunityPost[];
  count?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onSelectPost: (postId: string) => void;
  loading?: boolean;
}

export const BestPostsSection: React.FC<BestPostsSectionProps> = ({
  posts, count = 3, showViewAll = true, onViewAll, onSelectPost, loading = false,
}) => {
  const ranked = useMemo(
    () => [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, count),
    [posts, count]
  );

  return (
    <div className="bg-surface border-b border-line">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          <h2 className="font-bold text-ink text-sm">ベスト投稿</h2>
        </div>
        {showViewAll && (
          <button onClick={onViewAll} className="text-xs text-ink-faint hover:text-ink-muted underline underline-offset-2 transition-colors duration-200">
            すべて見る
          </button>
        )}
      </div>
      <div>
        {loading ? (
          Array.from({ length: count }).map((_, i) => <BestPostRowSkeleton key={i} />)
        ) : ranked.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-faint">まだ投稿がありません</p>
        ) : (
          ranked.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="px-4 py-3 border-t border-line cursor-pointer hover:bg-canvas transition-colors duration-200"
            >
              <h3 className="font-bold text-ink text-sm line-clamp-1 mb-1">{post.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">{getCommunityBoardLabel(post.boardId)}</span>
                <div className="flex items-center gap-3 text-xs text-ink-faint">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount ?? 0}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.commentCount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
