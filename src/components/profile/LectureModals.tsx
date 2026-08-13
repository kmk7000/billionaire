import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { LectureEditor } from '../../hooks/useLectureEditor';

export const LectureModals: React.FC<{ lecture: LectureEditor }> = ({ lecture: l }) => (
  <>
    {/* Lecture Edit Overlay */}
    <AnimatePresence>
      {l.isEditOpen && (
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
              <button onClick={l.close}>
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">講義・諮問活動追加</h2>
            </div>
            <button
              onClick={l.handleSave}
              disabled={!l.title || !l.date}
              className={`font-bold text-sm ${(!l.title || !l.date) ? 'text-gray-300' : 'text-gray-900'}`}
            >
              保存
            </button>
          </div>

          <div className="p-4 bg-white">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={l.title}
                  onChange={(e) => l.setTitle(e.target.value)}
                  placeholder="講義や諮問活動の内容を入力"
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-black focus:ring-0"
                />
              </div>

              {/* Date Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  活動時期
                </label>
                <div
                  onClick={l.openDatePicker}
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={l.date ? 'text-gray-900' : 'text-gray-400'}>
                    {l.date ? `${l.date.split('-')[0]}年 ${l.date.split('-')[1]}月` : '例）2025年 4月'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Lecture Date Picker Overlay */}
    <AnimatePresence>
      {l.isDatePickerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => l.setIsDatePickerOpen(false)}
            className="fixed inset-0 bg-black/40 z-[80] max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white z-[90] rounded-t-2xl max-w-md mx-auto"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <button
                onClick={l.clearDate}
                className="text-[#0A0A0A] font-medium"
              >
                削除
              </button>
              <button
                onClick={l.confirmDate}
                className="text-[#0A0A0A] font-medium"
              >
                完了
              </button>
            </div>
            <div className="flex justify-center items-center h-48 gap-8 px-8 relative">
              <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="lecture-year-scroll">
                <div className="h-20"></div>
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + 10 - i).map(year => (
                  <div
                    key={year}
                    onClick={() => l.setTempDate(prev => ({ ...prev, year }))}
                    className={`h-8 flex items-center justify-center snap-center cursor-pointer ${l.tempDate.year === year ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                  >
                    {year}年
                  </div>
                ))}
                <div className="h-20"></div>
              </div>
              <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="lecture-month-scroll">
                <div className="h-20"></div>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <div
                    key={month}
                    onClick={() => l.setTempDate(prev => ({ ...prev, month }))}
                    className={`h-8 flex items-center justify-center snap-center cursor-pointer ${l.tempDate.month === month ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                  >
                    {month}月
                  </div>
                ))}
                <div className="h-20"></div>
              </div>
              {/* Selection Highlight */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-8 bg-gray-100 rounded-lg -z-10 pointer-events-none"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
