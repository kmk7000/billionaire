import React, { useMemo } from 'react';
import { Eye, ThumbsUp } from 'lucide-react';
import type { CommunityPost } from '../../types/db';
import { getCommunityBoardLabel } from '../../constants/communityBoards';

interface RecommendedSidebarProps {
  posts: CommunityPost[];
  onSelectPost: (postId: string) => void;
  /** Render as a plain block for embedding in the mobile feed instead of the sticky desktop sidebar. */
  inline?: boolean;
}

export const RecommendedSidebar: React.FC<RecommendedSidebarProps> = ({ posts, onSelectPost, inline = false }) => {
  const recommended = useMemo(
    () => [...posts].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 8),
    [posts]
  );

  const Wrapper = inline ? 'div' : 'aside';

  return (
    <Wrapper className={inline ? 'space-y-4' : 'hidden lg:block w-80 shrink-0 space-y-4 sticky top-20'}>
      <div className={inline ? 'bg-white rounded-xl border border-gray-200 p-4 shadow-xs' : 'bg-white p-4'}>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">推薦投稿</h3>
          <span className="text-[10px] text-gray-400">Remember Live</span>
        </div>

        <div className="space-y-3">
          {recommended.length === 0 ? (
            <p className="text-xs text-gray-400">まだ投稿がありません</p>
          ) : (
            recommended.map((post, idx) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="flex items-start gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className={`font-black text-xs w-4 text-center ${idx < 3 ? 'text-[#C9483B]' : 'text-gray-400'}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-[#0A0A0A] transition-colors line-clamp-1">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span>{getCommunityBoardLabel(post.boardId)}</span>
                    <span>・</span>
                    <span className="flex items-center gap-0.5 text-[#0A0A0A] font-medium">
                      <Eye className="w-2.5 h-2.5" />
                      {post.viewCount ?? 0}
                    </span>
                    <span className="flex items-center gap-0.5 text-[#0A0A0A] font-medium">
                      <ThumbsUp className="w-2.5 h-2.5" />
                      {post.likeCount}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!inline && (
        <div className="text-[11px] text-gray-400 space-y-1.5 px-2">
          <div className="flex flex-wrap gap-2 text-gray-500 font-medium">
            <a href="#" className="hover:underline">利用規約</a>
            <span>・</span>
            <a href="#" className="hover:underline font-bold text-gray-700">プライバシーポリシー</a>
            <span>・</span>
            <a href="#" className="hover:underline">ヘルプセンター</a>
            <span>・</span>
            <a href="#" className="hover:underline">会社概要</a>
          </div>
          <p>© 2026 Billionaire Inc. All rights reserved.</p>
        </div>
      )}
    </Wrapper>
  );
};
