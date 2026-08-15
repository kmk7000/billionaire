import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, ThumbsUp, MoreVertical, Flag, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CommunityPost } from '../../types/db';
import type { UserProfile } from '../../types/app';
import { getCommunityBoardLabel } from '../../constants/communityBoards';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { communityService, safetyService } from '../../services/firestoreService';
import { useCommunityComments } from '../../hooks/useCommunityComments';
import { CommentThread } from './CommentThread';

interface PostDetailOverlayProps {
  post: CommunityPost;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  onBack: () => void;
}

const REPORT_REASONS: { value: 'inappropriate' | 'harassment' | 'spam' | 'confidential_leak' | 'impersonation'; label: string }[] = [
  { value: 'inappropriate', label: '不適切な内容' },
  { value: 'harassment', label: '嫌がらせ・誹謗中傷' },
  { value: 'spam', label: 'スパム・広告' },
  { value: 'confidential_leak', label: '会社の機密情報流出' },
  { value: 'impersonation', label: 'なりすまし' },
];

export const PostDetailOverlay: React.FC<PostDetailOverlayProps> = ({ post, user, userProfile, onBack }) => {
  const { threaded, addComment } = useCommunityComments(post.id);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    communityService.incrementView(post.id);
  }, [post.id]);

  const handleLike = () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikeCount((c) => c + 1);
    communityService.likePost(post.id);
  };

  const handleReport = async (reason: typeof REPORT_REASONS[number]['value']) => {
    if (!user) return;
    await safetyService.submitReport({
      reporterId: user.uid,
      targetType: 'post',
      targetId: post.id,
      reason,
    });
    setIsReportOpen(false);
  };

  const handleBlock = async () => {
    if (!user) return;
    await safetyService.blockUser(user.uid, post.authorId);
    setIsMoreOpen(false);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-surface z-[100] flex flex-col overflow-y-auto no-scrollbar pt-safe"
    >
      <div className="sticky top-0 bg-surface px-4 py-3 flex items-center justify-between z-10 border-b border-line">
        <button aria-label="戻る" onClick={onBack} className="p-2 -ml-2 text-ink">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={() => setIsMoreOpen(true)} className="p-1">
          <MoreVertical className="w-6 h-6 text-ink" />
        </button>
      </div>

      <div className="px-5 py-5 max-w-2xl w-full mx-auto">
        <span className="inline-block text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full mb-3">
          {getCommunityBoardLabel(post.boardId)}
        </span>
        <h1 className="text-lg font-bold text-ink mb-2">{post.title}</h1>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-4">
          <span className="font-bold text-ink-muted">{post.anonHandle}</span>
          <span>|</span>
          <span>{post.authorLabel}</span>
          <span className="text-ink-faint">・</span>
          <span className="text-ink-faint">{formatRelativeTime(post.createdAt)}</span>
        </div>

        <p className="text-[15px] text-ink whitespace-pre-wrap leading-relaxed mb-6">{post.body}</p>

        <div className="flex items-center gap-4 py-3 border-y border-line mb-2">
          <button aria-label="いいね"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
              hasLiked ? 'bg-primary text-white' : 'bg-primary-soft text-ink-muted'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> {likeCount}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-ink-faint">
            <Eye className="w-3.5 h-3.5" /> {post.viewCount ?? 0}
          </span>
        </div>

        <CommentThread threaded={threaded} postId={post.id} user={user} userProfile={userProfile} onSubmit={addComment} />
      </div>

      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 z-[200] flex items-end"
            onClick={() => setIsMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-surface w-full rounded-t-3xl p-6 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-primary-soft rounded-full mx-auto mb-8" />
              <div className="space-y-2">
                <button
                  onClick={() => { setIsMoreOpen(false); setIsReportOpen(true); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-canvas transition-colors"
                >
                  <Flag className="w-6 h-6 text-danger" />
                  <span className="font-bold text-danger">投稿を通報する</span>
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-canvas transition-colors"
                >
                  <Ban className="w-6 h-6 text-ink" />
                  <span className="font-bold text-ink">この作成者をブロックする</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/50 z-[300]"
              onClick={() => setIsReportOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              className="fixed top-1/2 left-1/2 w-[90%] max-w-sm bg-surface rounded-2xl z-[310] p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-ink mb-4 text-center">通報理由を選択</h3>
              <div className="space-y-1">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleReport(r.value)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-canvas text-sm font-medium text-ink"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="w-full mt-3 py-3 text-sm font-bold text-ink-faint"
              >
                キャンセル
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
