import React from 'react';
import { ArrowLeft, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { AwardsEditor } from '../../hooks/useAwardsEditor';

export const AwardsModals: React.FC<{ awards: AwardsEditor }> = ({ awards: a }) => (
  <AnimatePresence>
    {a.isEditOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-white z-[60] flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
          <div className="flex items-center justify-between p-4 relative">
            <div className="flex items-center gap-3">
              <button
                onClick={a.close}
                className="p-1 -ml-1"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">受賞及びその他の履歴編集</h2>
            </div>
            <button
              onClick={a.handleSave}
              className="font-bold text-orange-500 text-sm"
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900">
                受賞及びその他の履歴
              </label>
              {a.awardsList.map((award, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={award}
                    onChange={(e) => a.changeAward(index, e.target.value)}
                    placeholder="例) 2018 ベストアナリスト"
                    className="w-full h-[45px] px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 pr-10"
                  />
                  {award && (
                    <button
                      onClick={() => a.changeAward(index, '')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                    >
                      <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={a.addAwardInput}
              className="flex items-center gap-2 text-gray-900 font-bold py-2"
            >
              <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                <span className="text-sm leading-none">+</span>
              </div>
              追加
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
