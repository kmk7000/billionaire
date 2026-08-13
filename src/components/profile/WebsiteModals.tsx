import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { WebsiteEditor } from '../../hooks/useWebsiteEditor';

export const WebsiteModals: React.FC<{ website: WebsiteEditor }> = ({ website: w }) => (
  <AnimatePresence>
    {w.isEditOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-white z-50 flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
          <div className="flex items-center justify-between p-4 relative">
            <div className="flex items-center gap-3">
              <button aria-label="戻る"
                onClick={w.close}
                className="p-1 -ml-1"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">ウェブサイト・ブログ編集</h2>
            </div>
            <button
              onClick={w.handleSave}
              className="font-bold text-[#0A0A0A] text-sm"
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900">
                リンク・URL
              </label>
              {w.websiteUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => w.changeUrl(index, e.target.value)}
                    placeholder="ウェブサイトやブログのリンクを入力"
                    className="w-full h-[45px] px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={w.addUrlInput}
              className="flex items-center gap-2 text-gray-900 font-bold py-2"
            >
              <div className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              追加
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
