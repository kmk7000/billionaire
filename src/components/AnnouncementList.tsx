import React, { useEffect, useState } from 'react';
import { BellOff, ChevronDown, Loader2 } from 'lucide-react';
import { fetchPublishedAnnouncements, type Announcement } from '../services/announcementService';

// Shared お知らせ feed. Rendered both in the notifications panel (もっと見る
// and the header bell) and in the profile's お知らせ tab, so the same list
// cannot drift between the two places it appears.

function formatDate(value: any): string {
  if (!value) return '';
  const date: Date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '.');
}

export const AnnouncementList: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedAnnouncements().then((rows) => {
      if (cancelled) return;
      setItems(rows);
      // Open the newest by default: with a short list, making the user tap to
      // see the thing they came for is friction for nothing.
      if (rows.length > 0) setOpenId(rows[0].id);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className={`flex-1 flex items-center justify-center gap-2 text-ink-muted ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">読み込み中</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-3 text-ink-faint py-20 ${className}`}>
        <BellOff className="w-10 h-10" />
        <p className="text-sm">新しいお知らせはありません</p>
        <p className="text-xs px-10 text-center leading-relaxed">
          運営からのお知らせがある場合、ここに表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <article key={item.id} className="border-b border-line last:border-b-0">
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-canvas transition-colors"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-bold text-ink leading-relaxed">
                  {item.title}
                </span>
                <span className="block text-[12px] text-ink-faint mt-1">
                  {formatDate(item.publishedAt || item.createdAt)}
                </span>
              </span>
              <ChevronDown
                className={`w-5 h-5 text-ink-faint shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <p className="px-5 pb-5 text-[14px] text-ink-muted leading-relaxed whitespace-pre-line">
                {item.body}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
};
