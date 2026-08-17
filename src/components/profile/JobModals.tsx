import React from 'react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JOB_CATEGORIES } from '../../constants/profileData';
import type { JobEditor } from '../../hooks/useJobEditor';
import { ConfirmDialog } from '../ConfirmDialog';
import { UNSAVED_CHANGES_DIALOG, useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

export const JobModals: React.FC<{ job: JobEditor }> = ({ job: j }) => {
  // Back arrow and left-edge swipe both route through the guard, so a
  // half-filled form cannot be discarded without asking.
  const guard = useUnsavedChangesGuard(j.isDirty, j.close, j.isEditOpen);

  return (
  <AnimatePresence>
    {j.isEditOpen && (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-surface z-50 flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-surface z-20">
          <div className="px-4 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">職務選択</h2>
            <button aria-label="閉じる" onClick={guard.requestClose} className="p-1 -mr-1">
              <X className="w-6 h-6 text-ink" />
            </button>
          </div>
          <AnimatePresence>
            {j.selectionError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2"
              >
                <div className="bg-danger text-white text-[15px] font-medium py-3.5 px-4 text-center rounded-lg shadow-sm">
                  職務は最大5つまで登録できます。
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4 pb-4 border-b border-line">
          <div className="bg-canvas rounded-lg flex items-center px-3 py-2.5">
            <Search className="w-5 h-5 text-ink-faint mr-2" />
            <input
              type="text"
              placeholder="職務を検索してください"
              value={j.jobSearchQuery}
              onChange={(e) => j.setJobSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-40">
          {JOB_CATEGORIES.map(category => {
            const isCategoryMatch = category.category.toLowerCase().includes(j.jobSearchQuery.toLowerCase());
            const filteredRoles = category.roles.filter(role => role.toLowerCase().includes(j.jobSearchQuery.toLowerCase()));

            if (!isCategoryMatch && filteredRoles.length === 0) return null;

            const rolesToShow = isCategoryMatch ? category.roles : filteredRoles;

            return (
              <div key={category.category} className="border-b border-line">
                <button
                  onClick={() => j.toggleCategory(category.category)}
                  className="w-full flex items-center justify-between p-4 bg-surface hover:bg-canvas transition-colors"
                >
                  <span className="font-bold text-ink">{category.category}</span>
                  <ChevronDown className={`w-5 h-5 text-ink-muted transition-transform ${j.openCategory === category.category ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {j.openCategory === category.category && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-canvas"
                    >
                      <div className="py-2">
                        {rolesToShow.map((role) => {
                          const isSelected = j.selectedJobs.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => j.toggleJob(role)}
                              className={`w-full text-left px-6 py-3 text-sm flex items-center justify-between transition-colors ${isSelected ? 'text-primary font-bold' : 'text-ink-muted hover:bg-primary-soft'}`}
                            >
                              {role}
                              {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line p-4 z-20 max-w-md mx-auto">
          {j.selectedJobs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {j.selectedJobs.map(role => {
                const category = JOB_CATEGORIES.find(c => c.roles.includes(role))?.category || '';
                return (
                  <span key={role} className="inline-flex items-center gap-1 px-3 py-1.5 bg-canvas text-ink-muted rounded-full text-xs border border-line">
                    {category} &gt; {role}
                    <button onClick={() => j.removeJob(role)} className="p-0.5 hover:bg-line rounded-full ml-1">
                      <X className="w-3 h-3 text-ink-faint" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={j.clearSelection}
              className="flex-1 py-3.5 border border-line rounded-lg font-bold text-ink bg-surface hover:bg-canvas transition-colors"
            >
              選択初期化
            </button>
            <button
              onClick={j.handleSave}
              className="flex-1 py-3.5 rounded-lg font-bold text-white bg-primary hover:opacity-90 transition-colors"
            >
              適用
            </button>
          </div>
        </div>
      </motion.div>
    )}
    <ConfirmDialog
      isOpen={guard.isPrompting}
      {...UNSAVED_CHANGES_DIALOG}
      destructive
      onConfirm={guard.confirmDiscard}
      onCancel={guard.cancelDiscard}
    />
  </AnimatePresence>
  );
};
