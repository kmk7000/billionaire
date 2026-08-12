import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COMMUNITY_BOARDS, getCommunityBoardLabel } from '../../constants/communityBoards';
import type { CommunityWrite } from '../../hooks/useCommunityWrite';

interface WritePostModalProps {
  write: CommunityWrite;
  onPosted: (postId: string) => void;
}

export const WritePostModal: React.FC<WritePostModalProps> = ({ write, onPosted }) => {
  const { isOpen, close, boardId, setBoardId, title, setTitle, body, setBody, canSubmit, isSubmitting, handleSubmit } = write;

  const handleSubmitClick = async () => {
    const newId = await handleSubmit();
    if (newId) onPosted(newId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[150] flex items-end sm:items-center sm:justify-center"
          onClick={close}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">投稿を作成</h2>
              <button onClick={close} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">掲示板を選択</label>
                <div className="flex flex-wrap gap-2">
                  {COMMUNITY_BOARDS.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => setBoardId(board.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        boardId === board.id ? 'bg-[#0A0A0A] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getCommunityBoardLabel(board.id)}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトルを入力してください"
                maxLength={100}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-black"
              />

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="内容を入力してください"
                rows={8}
                maxLength={3000}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-black"
              />
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleSubmitClick}
                disabled={!canSubmit || isSubmitting}
                className="w-full py-3 rounded-xl bg-black text-white font-bold text-sm disabled:bg-gray-300 transition-colors"
              >
                {isSubmitting ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
