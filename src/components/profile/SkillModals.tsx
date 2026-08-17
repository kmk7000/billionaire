import React from 'react';
import { X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserProfile } from '../../types/app';
import { ALL_SKILLS, JOB_CATEGORIES, SKILL_RECOMMENDATIONS } from '../../constants/profileData';
import type { SkillEditor } from '../../hooks/useSkillEditor';
import { ConfirmDialog } from '../ConfirmDialog';
import { UNSAVED_CHANGES_DIALOG, useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

export const SkillModals: React.FC<{ skill: SkillEditor; userProfile: UserProfile | null }> = ({ skill: s, userProfile }) => {
  // Back arrow and left-edge swipe both route through the guard, so a
  // half-filled form cannot be discarded without asking.
  const guard = useUnsavedChangesGuard(s.isDirty, s.close, s.isEditOpen);

  return (
  <AnimatePresence>
    {s.isEditOpen && (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-surface z-50 flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-surface z-20">
          <div className="px-4 py-4 flex items-center justify-between relative">
            <div className="w-6" />
            <h2 className="text-lg font-bold text-ink">専門分野・スキル選択</h2>
            <button aria-label="閉じる" onClick={guard.requestClose} className="p-2.5 -mr-2.5">
              <X className="w-6 h-6 text-ink" />
            </button>
          </div>

          {/* Selected Skills Chips */}
          {s.selectedSkills.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {s.selectedSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-primary text-white rounded-full text-sm font-medium flex items-center gap-1">
                    {skill}
                    <button onClick={() => s.setSelectedSkills(prev => prev.filter(sk => sk !== skill))} className="p-0.5 hover:opacity-90 rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="w-5 h-5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="スキルを検索"
                value={s.skillSearchQuery}
                onChange={(e) => s.setSkillSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-[45px] bg-primary-soft border-transparent rounded-md text-sm focus:bg-surface focus:border-primary focus:ring-0 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="space-y-6">
            {s.skillSearchQuery ? (
              // Search Results
              <div className="space-y-2">
                {ALL_SKILLS
                  .filter(skill => skill.toLowerCase().includes(s.skillSearchQuery.toLowerCase()))
                  .map((skill, idx) => {
                    const isSelected = s.selectedSkills.includes(skill);
                    return (
                      <button
                        key={idx}
                        onClick={() => s.toggleSkill(skill)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                          isSelected ? 'border-primary bg-canvas' : 'border-line bg-surface'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? 'text-ink' : 'text-ink-muted'}`}>
                          {skill}
                        </span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-line'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            ) : (
              // Recommended Skills View
              <div className="space-y-6">
                {(() => {
                  if (!userProfile?.jobs || userProfile.jobs.length === 0) {
                    return (
                      <div className="text-center py-8 text-ink-muted text-sm">
                        職務を追加すると、おすすめのスキルが表示されます。
                      </div>
                    );
                  }

                  const allRecommendedSkills = new Set<string>();
                  userProfile.jobs.forEach(job => {
                    const category = JOB_CATEGORIES.find(c => c.roles.includes(job))?.category;
                    if (category && SKILL_RECOMMENDATIONS[category]) {
                      SKILL_RECOMMENDATIONS[category].forEach(skill => allRecommendedSkills.add(skill));
                    }
                  });

                  const uniqueSkills = Array.from(allRecommendedSkills);

                  if (uniqueSkills.length === 0) {
                    return (
                      <div className="text-center py-8 text-ink-muted text-sm">
                        おすすめのスキルがありません。
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-ink">専門分野・スキル推薦</h3>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSkills.map((skill, skillIdx) => {
                          const isSelected = s.selectedSkills.includes(skill);
                          return (
                            <button
                              key={skillIdx}
                              onClick={() => s.toggleSkill(skill)}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                isSelected
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-surface text-ink-muted border-dashed border-line hover:border-ink-faint'
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-line">
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={s.clearSelection}
              className="flex-1 py-3.5 border border-line rounded-lg font-bold text-ink bg-surface hover:bg-canvas transition-colors"
            >
              選択初期化
            </button>
            <button
              onClick={s.handleSave}
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
