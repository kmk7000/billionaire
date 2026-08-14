import React, { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import type { CommunityPost } from '../../types/db';
import { getCommunityBoardLabel } from '../../constants/communityBoards';

interface DesktopSidebarProps {
  posts: CommunityPost[];
  onSelectPost: (postId: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ posts, onSelectPost }) => {
  const trending = useMemo(
    () => [...posts]
      .sort((a, b) => ((b.viewCount ?? 0) + b.likeCount * 3) - ((a.viewCount ?? 0) + a.likeCount * 3))
      .slice(0, 5),
    [posts]
  );

  return (
    <aside className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-20">
      {/* Real-time Trending Posts Widget */}
      <div className="bg-surface p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <h3 className="font-bold text-sm text-ink">人気の投稿 Top 5</h3>
          </div>
        </div>

        {trending.length === 0 ? (
          <p className="text-xs text-ink-faint py-2">まだ投稿がありません</p>
        ) : (
          <div className="space-y-3">
            {trending.map((post, idx) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="flex items-start gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-canvas transition-colors"
              >
                <span className={`font-black text-xs w-4 text-center ${idx < 3 ? 'text-accent' : 'text-ink-faint'}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors line-clamp-1">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-ink-faint mt-0.5">
                    <span>{getCommunityBoardLabel(post.boardId)}</span>
                    <span>・</span>
                    <span className="flex items-center gap-0.5 text-primary font-medium">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* App & Digital Business Card QR Widget */}
      <div className="bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2B2B2B] text-white rounded-xl p-4 shadow-xs flex items-center gap-4">
        <div className="bg-surface p-2 rounded-lg shrink-0">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '?c=billionaire_demo')}`}
            alt="Mobile App QR"
            className="w-16 h-16"
          />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-300">スマホ名刺スキャン Sync</p>
          <p className="text-[11px] text-white/70 mt-1 leading-snug">
            QRコードをスキャンして、モバイルアプリとデジタル名刺をすぐに確認できます。
          </p>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="text-[11px] text-ink-faint space-y-1.5 px-2">
        <div className="flex flex-wrap gap-2 text-ink-muted font-medium">
          <a href="#" className="hover:underline">利用規約</a>
          <span>・</span>
          <a href="#" className="hover:underline font-bold text-ink-muted">プライバシーポリシー</a>
          <span>・</span>
          <a href="#" className="hover:underline">ヘルプセンター</a>
          <span>・</span>
          <a href="#" className="hover:underline">会社概要</a>
        </div>
        <p>© 2026 Billionaire Inc. All rights reserved.</p>
      </div>
    </aside>
  );
};
