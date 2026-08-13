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
        className="fixed inset-0 bg-white z-50 flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
          <div className="px-4 py-4 flex items-center justify-between relative">
            <button
              onClick={l.close}
              className="p-1 -ml-1"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">外国語追加</h2>
            <button
              onClick={l.handleSave}
              disabled={!l.selectedLanguage || !l.selectedLevel}
              className={`font-bold ${!l.selectedLanguage || !l.selectedLevel ? 'text-gray-300' : 'text-blue-600'}`}
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                言語 <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => l.setIsLanguageSelectOpen(true)}
                className="w-full flex items-center justify-between h-[45px] px-4 border border-gray-200 rounded-md bg-white text-left"
              >
                <span className={l.selectedLanguage ? "text-gray-900" : "text-gray-400"}>
                  {l.selectedLanguage || "言語を選択してください"}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Level Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                レベル <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => l.setIsLevelSelectOpen(true)}
                className="w-full flex items-center justify-between h-[45px] px-4 border border-gray-200 rounded-md bg-white text-left"
              >
                <span className={l.selectedLevel ? "text-gray-900" : "text-gray-400"}>
                  {l.selectedLevel || "レベルを選択してください"}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
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
                className="fixed inset-0 bg-black/40 z-[60]"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] flex flex-col max-h-[80vh]"
              >
                <div className="flex items-center justify-end p-4 border-b border-gray-100">
                  <button
                    onClick={() => l.setIsLanguageSelectOpen(false)}
                    className="font-bold text-blue-600"
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
                        l.selectedLanguage === lang ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-600'
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
                className="fixed inset-0 bg-black/40 z-[60]"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] flex flex-col"
              >
                <div className="flex items-center justify-end p-4 border-b border-gray-100">
                  <button
                    onClick={() => l.setIsLevelSelectOpen(false)}
                    className="font-bold text-blue-600"
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
                        l.selectedLevel === level ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-600'
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
