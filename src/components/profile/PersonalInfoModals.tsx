import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PersonalInfoEditor } from '../../hooks/usePersonalInfoEditor';

export const PersonalInfoModals: React.FC<{ personalInfo: PersonalInfoEditor }> = ({ personalInfo: p }) => (
  <AnimatePresence>
    {p.isEditOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <button onClick={p.close} className="mr-3">
            <X className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">人的事項</h2>
        </div>

        <div className="p-5 bg-white flex-1">
          {/* Gender Section */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4">性別</h3>
            <div className="flex gap-2">
              {['男性', '女性', '選択しない'].map((option) => (
                <button
                  key={option}
                  onClick={() => p.setGender(option as '男性' | '女性' | '選択しない')}
                  className={`flex-1 py-3.5 rounded-md font-bold text-[15px] border transition-colors ${
                    p.gender === option
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Birth Year Section */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4">出生年度</h3>
            <div className="relative">
              <select
                value={p.birthYear || ''}
                onChange={(e) => p.setBirthYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-md h-[52px] px-4 text-[15px] focus:outline-none focus:border-black focus:ring-0 appearance-none bg-white"
              >
                <option value="" disabled>選択してください</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <p className="text-[13px] text-gray-400 leading-relaxed mt-12">
            * 採用提案および求人支援の確認のため、採用担当者とヘッドハンターにのみ公開されます。
          </p>
        </div>

        {/* Bottom Fixed Button */}
        <div className="p-4 bg-white mt-auto">
          <button
            onClick={p.handleSave}
            disabled={p.isUnchanged}
            className={`w-full font-bold py-4 rounded-lg transition-colors ${
              !p.isUnchanged
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-[#e5e5e5] text-white cursor-not-allowed'
            }`}
          >
            保存
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
