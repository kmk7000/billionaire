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
        className="fixed inset-0 bg-surface z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col pt-safe"
      >
        {/* Header */}
        <div className="flex items-center p-4 bg-surface border-b border-line sticky top-0 z-10">
          <button aria-label="閉じる" onClick={p.close} className="mr-3">
            <X className="w-6 h-6 text-ink" />
          </button>
          <h2 className="text-lg font-bold text-ink">人的事項</h2>
        </div>

        <div className="p-5 bg-surface flex-1">
          {/* Gender Section */}
          <div className="mb-8">
            <h3 className="font-bold text-ink mb-4">性別</h3>
            <div className="flex gap-2">
              {['男性', '女性', '選択しない'].map((option) => (
                <button
                  key={option}
                  onClick={() => p.setGender(option as '男性' | '女性' | '選択しない')}
                  className={`flex-1 py-3.5 rounded-md font-bold text-[15px] border transition-colors ${
                    p.gender === option
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-ink border-line hover:bg-canvas'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Birth Year Section */}
          <div className="mb-8">
            <h3 className="font-bold text-ink mb-4">出生年度</h3>
            <div className="relative">
              <select
                value={p.birthYear || ''}
                onChange={(e) => p.setBirthYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border border-line rounded-md h-[52px] px-4 text-[15px] focus:outline-none focus:border-primary focus:ring-0 appearance-none bg-surface"
              >
                <option value="" disabled>選択してください</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-ink-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <p className="text-[13px] text-ink-faint leading-relaxed mt-12">
            * 採用提案および求人支援の確認のため、採用担当者とヘッドハンターにのみ公開されます。
          </p>
        </div>

        {/* Bottom Fixed Button */}
        <div className="p-4 bg-surface mt-auto">
          <button
            onClick={p.handleSave}
            disabled={p.isUnchanged}
            className={`w-full font-bold py-4 rounded-lg transition-colors ${
              !p.isUnchanged
                ? 'bg-primary text-white hover:opacity-90'
                : 'bg-primary-soft text-ink-faint cursor-not-allowed'
            }`}
          >
            保存
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
