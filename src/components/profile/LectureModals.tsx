import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WheelPickerColumn, WheelPickerBand } from './WheelPickerColumn';
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
          className="fixed inset-0 bg-surface z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-surface border-b border-line sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button aria-label="戻る" onClick={l.close}>
                <ArrowLeft className="w-6 h-6 text-ink" />
              </button>
              <h2 className="text-lg font-bold text-ink">講義・諮問活動追加</h2>
            </div>
            <button
              onClick={l.handleSave}
              disabled={!l.title || !l.date}
              className={`font-bold text-sm ${(!l.title || !l.date) ? 'text-ink-faint' : 'text-ink'}`}
            >
              保存
            </button>
          </div>

          <div className="p-4 bg-surface">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  タイトル <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={l.title}
                  onChange={(e) => l.setTitle(e.target.value)}
                  placeholder="講義や諮問活動の内容を入力"
                  className="w-full border border-line rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-primary focus:ring-0"
                />
              </div>

              {/* Date Field */}
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  活動時期
                </label>
                <div
                  onClick={l.openDatePicker}
                  className="w-full border border-line rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={l.date ? 'text-ink' : 'text-ink-faint'}>
                    {l.date ? `${l.date.split('-')[0]}年 ${l.date.split('-')[1]}月` : '例）2025年 4月'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-ink-faint" />
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
            className="fixed inset-0 bg-primary/40 z-[80] max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-surface z-[90] rounded-t-2xl max-w-md mx-auto"
          >
            <div className="flex justify-between items-center p-4 border-b border-line">
              <button
                onClick={l.clearDate}
                className="text-primary font-medium"
              >
                削除
              </button>
              <button
                onClick={l.confirmDate}
                className="text-primary font-medium"
              >
                完了
              </button>
            </div>
            <div className="flex justify-center items-center h-48 gap-8 px-8 relative">
              <WheelPickerColumn
                items={Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + 10 - i)}
                value={l.tempDate.year}
                onChange={(year) => l.setTempDate(prev => ({ ...prev, year }))}
                formatLabel={(year) => `${year}年`}
                ariaLabel="年"
              />
              <WheelPickerColumn
                items={Array.from({ length: 12 }, (_, i) => i + 1)}
                value={l.tempDate.month}
                onChange={(month) => l.setTempDate(prev => ({ ...prev, month }))}
                formatLabel={(month) => `${month}月`}
                ariaLabel="月"
              />
              <WheelPickerBand />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
