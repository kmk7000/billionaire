import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, Contact, MessageSquare, Eye, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import type { Meishi } from '../types/app';
import type { CommunityPost } from '../types/db';
import { getCommunityBoardLabel } from '../constants/communityBoards';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface SearchOverlayProps {
  meishis: Meishi[];
  posts: CommunityPost[];
  onClose: () => void;
  onSelectMeishi: (meishi: Meishi) => void;
  onSelectPost: (postId: string) => void;
}

const matches = (haystack: (string | undefined)[], needle: string) =>
  haystack.some(h => h && h.toLowerCase().includes(needle));

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  meishis, posts, onClose, onSelectMeishi, onSelectPost,
}) => {
  const [queryText, setQueryText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const needle = queryText.trim().toLowerCase();

  const meishiResults = useMemo(() => {
    if (!needle) return [];
    return meishis
      .filter(m => matches([m.name, m.company, m.position, m.department], needle))
      .slice(0, 20);
  }, [meishis, needle]);

  const postResults = useMemo(() => {
    if (!needle) return [];
    return posts
      .filter(p => matches([p.title, p.body], needle))
      .slice(0, 20);
  }, [posts, needle]);

  // Left-edge swipe closes, same as the back arrow.
  useSwipeBack(onClose);

  const hasQuery = needle.length > 0;
  const hasResults = meishiResults.length > 0 || postResults.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-surface z-[120] flex flex-col pt-safe lg:max-w-2xl lg:mx-auto lg:my-8 lg:rounded-2xl lg:shadow-lg lg:h-[80vh] lg:inset-x-0"
    >
      {/* Search Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
        <button aria-label="閉じる" onClick={onClose} className="p-2 -ml-1 text-ink">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="会社名、お名前、投稿キーワードで検索"
            className="w-full bg-canvas rounded-full pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:ring-1 focus:ring-line"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
        {!hasQuery ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink-faint gap-2">
            <Search className="w-8 h-8" />
            <p className="text-sm">名刺やコミュニティ投稿を検索できます</p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink-faint gap-2">
            <p className="text-sm">「{queryText}」に一致する結果がありません</p>
          </div>
        ) : (
          <>
            {meishiResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <Contact className="w-4 h-4 text-ink-muted" />
                  <h2 className="text-xs font-bold text-ink-muted">名刺 ({meishiResults.length})</h2>
                </div>
                {meishiResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { onSelectMeishi(m); onClose(); }}
                    className="w-full text-left px-4 py-3 border-b border-line hover:bg-canvas transition-colors duration-200"
                  >
                    <p className="text-sm font-bold text-ink">{m.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {[m.position, m.department].filter(Boolean).join(' / ')}
                    </p>
                    <p className="text-xs text-ink-faint">{m.company}</p>
                  </button>
                ))}
              </div>
            )}

            {postResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <MessageSquare className="w-4 h-4 text-ink-muted" />
                  <h2 className="text-xs font-bold text-ink-muted">コミュニティ ({postResults.length})</h2>
                </div>
                {postResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelectPost(p.id); onClose(); }}
                    className="w-full text-left px-4 py-3 border-b border-line hover:bg-canvas transition-colors duration-200"
                  >
                    <p className="text-sm font-bold text-ink line-clamp-1">{p.title}</p>
                    <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{p.body}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-faint">
                      <span>{getCommunityBoardLabel(p.boardId)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.viewCount ?? 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {p.likeCount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
