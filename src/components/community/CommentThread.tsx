import React, { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CommunityComment } from '../../types/db';
import type { UserProfile } from '../../types/app';
import type { SortedComment } from '../../hooks/useCommunityComments';
import { generateAnonHandle } from '../../utils/anonHandle';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

type SortMode = 'likes' | 'new';

interface CommentThreadProps {
  threaded: SortedComment[];
  postId: string;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  onSubmit: (comment: Omit<CommunityComment, 'id' | 'likeCount' | 'status' | 'createdAt'>) => Promise<void>;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ threaded, postId, user, userProfile, onSubmit }) => {
  const [sortMode, setSortMode] = useState<SortMode>('new');
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fixed for this viewing session, matching docs/SPEC.md's "thread-fixed" anonymous handle.
  const [sessionHandle] = useState(() => generateAnonHandle(userProfile?.jobs?.[0] || userProfile?.position));

  const sorted = useMemo(() => {
    const copy = [...threaded];
    if (sortMode === 'likes') copy.sort((a, b) => b.likeCount - a.likeCount);
    return copy;
  }, [threaded, sortMode]);

  const handleSubmit = async () => {
    if (!user || !draft.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        postId,
        authorId: user.uid,
        anonHandle: sessionHandle,
        authorLabel: userProfile?.jobs?.[0] || userProfile?.position || '会社員',
        body: draft.trim(),
      });
      setDraft('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">コメント {threaded.reduce((sum, c) => sum + 1 + c.replies.length, 0)}件</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <button onClick={() => setSortMode('likes')} className={sortMode === 'likes' ? 'font-bold text-gray-900' : ''}>共感順</button>
          <button onClick={() => setSortMode('new')} className={sortMode === 'new' ? 'font-bold text-gray-900' : ''}>新着順</button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`${sessionHandle}として書き込む`}
          className="flex-1 h-[40px] px-3 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-black"
        />
        <button aria-label="送信"
          onClick={handleSubmit}
          disabled={!draft.trim() || isSubmitting}
          className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center disabled:bg-gray-300 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          <p>登録されたコメントがありません</p>
          <p className="mt-1">最初のコメントを書いてみましょう</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sorted.map((comment) => (
            <div key={comment.id}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm text-gray-900">{comment.anonHandle}</span>
                <span className="text-[10px] text-gray-400">{comment.authorLabel}</span>
                <span className="text-[10px] text-gray-300 ml-auto">{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
              {comment.replies.length > 0 && (
                <div className="ml-4 mt-3 space-y-3 border-l-2 border-gray-100 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">{reply.anonHandle}</span>
                        <span className="text-[10px] text-gray-400">{reply.authorLabel}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">{formatRelativeTime(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
