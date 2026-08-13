import React from 'react';
import { ArrowLeft, ChevronRight, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ArticleEditor } from '../../hooks/useArticleEditor';

export const ArticleModals: React.FC<{ article: ArticleEditor }> = ({ article: a }) => (
  <>
    {/* Article List Edit Overlay */}
    <AnimatePresence>
      {a.isListOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <div className="flex items-center p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
            <button onClick={a.closeList} className="mr-3">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">記事編集</h2>
          </div>

          <div className="p-4 bg-white">
            <button
              onClick={a.openNew}
              className="w-full flex items-center text-orange-500 font-bold mb-6"
            >
              <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center mr-2">
                <span className="text-sm leading-none">+</span>
              </div>
              記事追加
            </button>

            <div className="space-y-0">
              {a.articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between py-4 border-b border-gray-100 cursor-pointer"
                  onClick={() => a.openExisting(article)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-gray-900 font-medium truncate">{article.title}</h4>
                    <p className="text-sm text-gray-400 truncate mt-1">{article.url}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
          className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={a.close}>
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">{a.editingArticleId ? '記事編集' : '記事追加'}</h2>
            </div>
            <button
              onClick={a.handleSave}
              disabled={!a.title || !a.url || !a.isUrlValid}
              className={`font-bold text-sm ${(!a.title || !a.url || !a.isUrlValid) ? 'text-gray-300' : 'text-orange-500'}`}
            >
              保存
            </button>
          </div>

          <div className="p-4 bg-white">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  記事のタイトル <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={a.title}
                    onChange={(e) => a.setTitle(e.target.value)}
                    placeholder="記事を表示するテキストを入力"
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-black focus:ring-0 pr-10"
                  />
                  {a.title && (
                    <button
                      onClick={() => a.setTitle('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                    >
                      <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* URL Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  リンク・URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={a.url}
                    onChange={(e) => a.setUrl(e.target.value)}
                    placeholder="記事のリンクを入力"
                    className={`w-full border rounded-md h-[45px] px-4 text-sm focus:outline-none focus:ring-0 pr-10 ${
                      a.url.length > 0 && !a.isUrlValid
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-black'
                    }`}
                  />
                  {a.url && (
                    <button
                      onClick={() => a.setUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                    >
                      <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                    </button>
                  )}
                </div>
                {a.url.length > 0 && !a.isUrlValid && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
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
                  className="text-gray-500 font-medium"
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
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-[320px] p-6 text-center"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              記事を<br/>削除しますか？
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => a.setIsDeleteModalOpen(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-900 font-bold"
              >
                取消
              </button>
              <button
                onClick={a.handleDelete}
                className="flex-1 py-3 bg-[#f05656] text-white rounded-lg font-bold"
              >
                削除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
