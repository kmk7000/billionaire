import React from 'react';
import { ArrowLeft, ChevronRight, ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WheelPickerColumn, WheelPickerBand } from './WheelPickerColumn';
import { JAPANESE_UNIVERSITIES, JAPANESE_MAJORS, DEGREES } from '../../constants/profileData';
import type { EducationEditor } from '../../hooks/useEducationEditor';

export const EducationModals: React.FC<{ education: EducationEditor }> = ({ education: e }) => (
  <>
    {/* Education Edit Overlay */}
    <AnimatePresence>
      {e.isEditOpen && (
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
              <button aria-label="戻る" onClick={e.close}>
                <ArrowLeft className="w-6 h-6 text-ink" />
              </button>
              <h2 className="text-lg font-bold text-ink">学歴追加</h2>
            </div>
            <button
              onClick={e.handleSave}
              disabled={!e.school}
              className={`font-bold text-sm ${!e.school ? 'text-ink-faint' : 'text-ink'}`}
            >
              保存
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* School Field */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">
                学校 <span className="text-danger">*</span>
              </label>
              <div
                onClick={() => e.setIsSchoolSearchOpen(true)}
                className="w-full border border-line rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
              >
                <span className={e.school ? 'text-ink' : 'text-ink-faint'}>
                  {e.school || '例）東京大学'}
                </span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </div>
            </div>

            {/* Degree Field */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">
                学位
              </label>
              <div
                onClick={() => e.setIsDegreeSelectOpen(true)}
                className="w-full border border-line rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
              >
                <span className={e.degree ? 'text-ink' : 'text-ink-faint'}>
                  {e.degree || '学位を選択'}
                </span>
                <ChevronDown className="w-5 h-5 text-ink-faint" />
              </div>
            </div>

            {/* Major Field */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">
                専攻
              </label>
              <div
                onClick={() => e.setIsMajorSearchOpen(true)}
                className="w-full border border-line rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
              >
                <span className={e.major ? 'text-ink' : 'text-ink-faint'}>
                  {e.major || '例）経営学'}
                </span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </div>
            </div>

            {/* Date Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-ink mb-2">
                  入学
                </label>
                <div
                  onClick={() => e.openYearPicker('start')}
                  className="w-full border border-line rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={e.startDate ? 'text-ink' : 'text-ink-faint'}>
                    {e.startDate ? `${e.startDate}年` : '入学年度'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-ink-faint" />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-bold text-ink mb-2">
                  卒業
                </label>
                <div
                  onClick={() => {
                    if (!e.isCurrent) e.openYearPicker('end');
                  }}
                  className={`w-full border border-line rounded-md h-[45px] px-4 flex justify-between items-center ${e.isCurrent ? 'bg-canvas cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={e.endDate && !e.isCurrent ? 'text-ink' : 'text-ink-faint'}>
                    {e.isCurrent ? '卒業年度' : (e.endDate ? `${e.endDate}年` : '卒業年度')}
                  </span>
                  <ChevronDown className="w-5 h-5 text-ink-faint" />
                </div>
              </div>
            </div>

            {/* Is Current Checkbox */}
            <button
              onClick={() => e.setIsCurrent(!e.isCurrent)}
              className="flex items-center gap-2"
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${e.isCurrent ? 'border-primary bg-primary' : 'border-line'}`}>
                {e.isCurrent && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-ink">在学中</span>
            </button>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">
                研究分野および論文の説明
              </label>
              <div className="relative">
                <textarea
                  value={e.description}
                  onChange={(ev) => e.setDescription(ev.target.value.slice(0, 5000))}
                  placeholder="例）スマートフォンセールスにおいてバイラルマーケティングが与える影響の分析(2018)"
                  className="w-full border border-line rounded-lg p-3 h-40 resize-none focus:outline-none focus:border-ink-faint text-sm"
                />
                <div className="absolute bottom-3 right-3 text-xs text-ink-faint">
                  {e.description.length}/5000字
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* School Search Overlay */}
    <AnimatePresence>
      {e.isSchoolSearchOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[70] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          <div className="p-4 flex items-center gap-3 border-b border-line bg-surface sticky top-0 z-10">
            <div className="flex-1 bg-canvas rounded-lg flex items-center px-3 py-2">
              <Search className="w-5 h-5 text-ink-faint mr-2" />
              <input
                type="text"
                value={e.schoolSearchQuery}
                onChange={(ev) => e.setSchoolSearchQuery(ev.target.value)}
                placeholder="学校名を入力"
                className="bg-transparent w-full text-sm focus:outline-none"
                autoFocus
              />
              {e.schoolSearchQuery && (
                <button onClick={() => e.setSchoolSearchQuery('')}>
                  <X className="w-4 h-4 text-ink-faint bg-primary-soft rounded-full p-0.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                e.setIsSchoolSearchOpen(false);
                e.setSchoolSearchQuery('');
              }}
              className="text-sm font-medium"
            >
              キャンセル
            </button>
          </div>

          <div className="p-4">
            {e.schoolSearchQuery ? (
              <div>
                {JAPANESE_UNIVERSITIES.filter(name => name.includes(e.schoolSearchQuery)).map((school, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      e.setSchool(school);
                      e.setIsSchoolSearchOpen(false);
                      e.setSchoolSearchQuery('');
                    }}
                    className="py-3 border-b border-line text-sm cursor-pointer"
                  >
                    {school}
                  </div>
                ))}
                <div className="text-center mt-8">
                  <p className="text-sm text-ink-muted mb-2">お探しの学校名がありませんか？</p>
                  <button
                    onClick={() => {
                      e.setSchool(e.schoolSearchQuery);
                      e.setIsSchoolSearchOpen(false);
                      e.setSchoolSearchQuery('');
                    }}
                    className="text-primary text-sm font-medium underline"
                  >
                    '{e.schoolSearchQuery}' を直接入力
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-ink-faint mt-8">
                最近検索した学校名がありません
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Major Search Overlay */}
    <AnimatePresence>
      {e.isMajorSearchOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[70] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          <div className="p-4 flex items-center gap-3 border-b border-line bg-surface sticky top-0 z-10">
            <div className="flex-1 bg-canvas rounded-lg flex items-center px-3 py-2">
              <Search className="w-5 h-5 text-ink-faint mr-2" />
              <input
                type="text"
                value={e.majorSearchQuery}
                onChange={(ev) => e.setMajorSearchQuery(ev.target.value)}
                placeholder="専攻を入力"
                className="bg-transparent w-full text-sm focus:outline-none"
                autoFocus
              />
              {e.majorSearchQuery && (
                <button onClick={() => e.setMajorSearchQuery('')}>
                  <X className="w-4 h-4 text-ink-faint bg-primary-soft rounded-full p-0.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                e.setIsMajorSearchOpen(false);
                e.setMajorSearchQuery('');
              }}
              className="text-sm font-medium"
            >
              キャンセル
            </button>
          </div>

          <div className="p-4">
            {e.majorSearchQuery ? (
              <div>
                {JAPANESE_MAJORS.filter(name => name.includes(e.majorSearchQuery)).map((major, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      e.setMajor(major);
                      e.setIsMajorSearchOpen(false);
                      e.setMajorSearchQuery('');
                    }}
                    className="py-3 border-b border-line text-sm cursor-pointer"
                  >
                    {major}
                  </div>
                ))}
                <div className="text-center mt-8">
                  <p className="text-sm text-ink-muted mb-2">お探しの専攻がありませんか？</p>
                  <button
                    onClick={() => {
                      e.setMajor(e.majorSearchQuery);
                      e.setIsMajorSearchOpen(false);
                      e.setMajorSearchQuery('');
                    }}
                    className="text-primary text-sm font-medium underline"
                  >
                    '{e.majorSearchQuery}' を直接入力
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-ink-faint mt-8">
                最近検索した専攻がありません
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Degree Select Overlay */}
    <AnimatePresence>
      {e.isDegreeSelectOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => e.setIsDegreeSelectOpen(false)}
            className="fixed inset-0 bg-primary/40 z-[80] max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-surface z-[90] rounded-t-2xl max-w-md mx-auto"
          >
            <div className="p-4 border-b border-line flex justify-between items-center">
              <h3 className="font-bold text-ink">学位を選択</h3>
              <button onClick={() => e.setIsDegreeSelectOpen(false)}>
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {DEGREES.map((degree) => (
                <button
                  key={degree}
                  onClick={() => {
                    e.setDegree(degree);
                    e.setIsDegreeSelectOpen(false);
                  }}
                  className="w-full text-left py-3 px-4 rounded-lg hover:bg-canvas text-sm text-ink"
                >
                  {degree}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Education Year Picker Overlay */}
    <AnimatePresence>
      {e.isYearPickerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => e.setIsYearPickerOpen(null)}
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
                onClick={e.clearYear}
                className="text-primary font-medium"
              >
                削除
              </button>
              <button
                onClick={e.confirmYear}
                className="text-primary font-medium"
              >
                完了
              </button>
            </div>

            <div className="flex justify-center items-center h-48 px-8 relative">
              <WheelPickerColumn
                items={Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + 5 - i)}
                value={e.tempYear}
                onChange={e.setTempYear}
                formatLabel={(year) => `${year}年`}
                ariaLabel="年"
              />
              <WheelPickerBand />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
