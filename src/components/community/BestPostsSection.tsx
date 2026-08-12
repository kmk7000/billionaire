import React, { useMemo } from 'react';
import { Trophy, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import type { CommunityPost } from '../../types/db';
import { getCommunityBoardLabel } from '../../constants/communityBoards';

interface BestPostsSectionProps {
  posts: CommunityPost[];
  count?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onSelectPost: (postId: string) => void;
}

export const BestPostsSection: React.FC<BestPostsSectionProps> = ({
  posts, count = 3, showViewAll = true, onViewAll, onSelectPost,
}) => {
  const ranked = useMemo(
    () => [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, count),
    [posts, count]
  );

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="font-bold text-gray-900 text-sm">ベスト投稿</h2>
        </div>
        {showViewAll && (
          <button onClick={onViewAll} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            すべて見る
          </button>
        )}
      </div>
      <div>
        {ranked.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-gray-400">まだ投稿がありません</p>
        ) : (
          ranked.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="px-4 py-3 border-t border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{post.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{getCommunityBoardLabel(post.boardId)}</span>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
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
