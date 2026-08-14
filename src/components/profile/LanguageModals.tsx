import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LANGUAGES, LANGUAGE_LEVELS } from '../../constants/profileData';
import type { LanguageEditor } from '../../hooks/useLanguageEditor';

export const LanguageModals: React.FC<{ language: LanguageEditor }> = ({ language: l }) => (
  <AnimatePresence>
    {l.isEditOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-surface z-50 flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-surface z-20 border-b border-line">
          <div className="px-4 py-4 flex items-center justify-between relative">
            <button aria-label="戻る"
              onClick={l.close}
              className="p-1 -ml-1"
            >
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h2 className="text-lg font-bold text-ink">外国語追加</h2>
            <button
              onClick={l.handleSave}
              disabled={!l.selectedLanguage || !l.selectedLevel}
              className={`font-bold ${!l.selectedLanguage || !l.selectedLevel ? 'text-ink-faint' : 'text-primary'}`}
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink">
                言語 <span className="text-danger">*</span>
              </label>
              <button
                onClick={() => l.setIsLanguageSelectOpen(true)}
                className="w-full flex items-center justify-between h-[45px] px-4 border border-line rounded-md bg-surface text-left"
              >
                <span className={l.selectedLanguage ? "text-ink" : "text-ink-faint"}>
                  {l.selectedLanguage || "言語を選択してください"}
                </span>
                <ChevronDown className="w-5 h-5 text-ink-faint" />
              </button>
            </div>

            {/* Level Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink">
                レベル <span className="text-danger">*</span>
              </label>
              <button
                onClick={() => l.setIsLevelSelectOpen(true)}
                className="w-full flex items-center justify-between h-[45px] px-4 border border-line rounded-md bg-surface text-left"
              >
                <span className={l.selectedLevel ? "text-ink" : "text-ink-faint"}>
                  {l.selectedLevel || "レベルを選択してください"}
                </span>
                <ChevronDown className="w-5 h-5 text-ink-faint" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Sheets for Selection */}
        <AnimatePresence>
          {l.isLanguageSelectOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => l.setIsLanguageSelectOpen(false)}
                className="fixed inset-0 bg-primary/40 z-[60]"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[70] flex flex-col max-h-[80vh]"
              >
                <div className="flex items-center justify-end p-4 border-b border-line">
                  <button
                    onClick={() => l.setIsLanguageSelectOpen(false)}
                    className="font-bold text-primary"
                  >
                    完了
                  </button>
                </div>
                <div className="overflow-y-auto py-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => l.setSelectedLanguage(lang)}
                      className={`w-full text-center py-3 text-[14px] ${
                        l.selectedLanguage === lang ? 'bg-primary-soft font-bold text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {l.isLevelSelectOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => l.setIsLevelSelectOpen(false)}
                className="fixed inset-0 bg-primary/40 z-[60]"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[70] flex flex-col"
              >
                <div className="flex items-center justify-end p-4 border-b border-line">
                  <button
                    onClick={() => l.setIsLevelSelectOpen(false)}
                    className="font-bold text-primary"
                  >
                    完了
                  </button>
                </div>
                <div className="py-2">
                  {LANGUAGE_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => l.setSelectedLevel(level)}
                      className={`w-full text-center py-3 text-[14px] ${
                        l.selectedLevel === level ? 'bg-primary-soft font-bold text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    )}
  </AnimatePresence>
);
