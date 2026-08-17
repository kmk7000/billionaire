import React from 'react';
import { ArrowLeft, ChevronRight, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ArticleEditor } from '../../hooks/useArticleEditor';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { ConfirmDialog } from '../ConfirmDialog';
import { UNSAVED_CHANGES_DIALOG, useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

export const ArticleModals: React.FC<{ article: ArticleEditor }> = ({ article: a }) => {
  // The list is a read-only page; the editor beneath it is a form and is
  // deliberately left out until it can prompt about unsaved input.
  useSwipeBack(a.closeList, a.isListOpen);
  // The editor opens on top of the list, so it registers after it — the
  // gesture stack hands a swipe to the last registration.
  const editGuard = useUnsavedChangesGuard(a.isDirty, a.close, a.isEditOpen);

  return (
  <>
    {/* Article List Edit Overlay */}
    <AnimatePresence>
      {a.isListOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
        >
          {/* Header */}
          <div className="flex items-center p-4 bg-surface border-b border-line sticky top-0 z-10 pt-safe">
            <button aria-label="戻る" onClick={a.closeList} className="mr-3">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h2 className="text-lg font-bold text-ink">記事編集</h2>
          </div>

          <div className="p-4 bg-surface">
            <button
              onClick={a.openNew}
              className="w-full flex items-center text-primary font-bold mb-6"
            >
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                <span className="text-sm leading-none">+</span>
              </div>
              記事追加
            </button>

            <div className="space-y-0">
              {a.articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between py-4 border-b border-line cursor-pointer"
                  onClick={() => a.openExisting(article)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-ink font-medium truncate">{article.title}</h4>
                    <p className="text-sm text-ink-faint truncate mt-1">{article.url}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ink-faint flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Article Edit Overlay */}
    <AnimatePresence>
      {a.isEditOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-surface border-b border-line sticky top-0 z-10 pt-safe">
            <div className="flex items-center gap-3">
              <button aria-label="戻る" onClick={editGuard.requestClose}>
                <ArrowLeft className="w-6 h-6 text-ink" />
              </button>
              <h2 className="text-lg font-bold text-ink">{a.editingArticleId ? '記事編集' : '記事追加'}</h2>
            </div>
            <button
              onClick={a.handleSave}
              disabled={!a.title || !a.url || !a.isUrlValid}
              className={`font-bold text-sm ${(!a.title || !a.url || !a.isUrlValid) ? 'text-ink-faint' : 'text-primary'}`}
            >
              保存
            </button>
          </div>

          <div className="p-4 bg-surface">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  記事のタイトル <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={a.title}
                    onChange={(e) => a.setTitle(e.target.value)}
                    placeholder="記事を表示するテキストを入力"
                    className="w-full border border-line rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-primary focus:ring-0 pr-10"
                  />
                  {a.title && (
                    <button
                      onClick={() => a.setTitle('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                    >
                      <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* URL Field */}
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  リンク・URL <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={a.url}
                    onChange={(e) => a.setUrl(e.target.value)}
                    placeholder="記事のリンクを入力"
                    className={`w-full border rounded-md h-[45px] px-4 text-sm focus:outline-none focus:ring-0 pr-10 ${
                      a.url.length > 0 && !a.isUrlValid
                        ? 'border-danger focus:border-danger'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  {a.url && (
                    <button
                      onClick={() => a.setUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                    >
                      <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                    </button>
                  )}
                </div>
                {a.url.length > 0 && !a.isUrlValid && (
                  <p className="text-danger text-sm mt-2 font-medium">
                    正しいリンク・URLの形式ではありません<br/>
                    (アドレスの前に https://, http:// が含まれている必要があります)
                  </p>
                )}
              </div>
            </div>

            {a.editingArticleId && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => a.setIsDeleteModalOpen(true)}
                  className="text-ink-muted font-medium"
                >
                  記事削除
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Delete Article Confirmation Modal */}
    <AnimatePresence>
      {a.isDeleteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-primary/50 z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-surface rounded-xl w-full max-w-[320px] p-6 text-center"
          >
            <h3 className="text-lg font-bold text-ink mb-6">
              記事を<br/>削除しますか？
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => a.setIsDeleteModalOpen(false)}
                className="flex-1 py-3 border border-line rounded-lg text-ink font-bold"
              >
                取消
              </button>
              <button
                onClick={a.handleDelete}
                className="flex-1 py-3 bg-danger text-white rounded-lg font-bold"
              >
                削除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  <ConfirmDialog
    isOpen={editGuard.isPrompting}
    {...UNSAVED_CHANGES_DIALOG}
    destructive
    onConfirm={editGuard.confirmDiscard}
    onCancel={editGuard.cancelDiscard}
  />
  </>
  );
};
