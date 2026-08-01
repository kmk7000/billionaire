import React from 'react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JOB_CATEGORIES } from '../../constants/profileData';
import type { JobEditor } from '../../hooks/useJobEditor';

export const JobModals: React.FC<{ job: JobEditor }> = ({ job: j }) => (
  <AnimatePresence>
    {j.isEditOpen && (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-white z-50 flex flex-col"
      >
        <div className="sticky top-0 bg-white z-20">
          <div className="px-4 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">職務選択</h2>
            <button onClick={j.close} className="p-1 -mr-1">
              <X className="w-6 h-6 text-gray-900" />
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
                <div className="bg-[#EF5350] text-white text-[15px] font-medium py-3.5 px-4 text-center rounded-lg shadow-sm">
                  職務は最大5つまで登録できます。
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4 pb-4 border-b border-gray-100">
          <div className="bg-gray-50 rounded-lg flex items-center px-3 py-2.5">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="職務を検索してください"
              value={j.jobSearchQuery}
              onChange={(e) => j.setJobSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 placeholder:text-gray-400"
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
              <div key={category.category} className="border-b border-gray-100">
                <button
                  onClick={() => j.toggleCategory(category.category)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">{category.category}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${j.openCategory === category.category ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {j.openCategory === category.category && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-gray-50"
                    >
                      <div className="py-2">
                        {rolesToShow.map((role) => {
                          const isSelected = j.selectedJobs.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => j.toggleJob(role)}
                              className={`w-full text-left px-6 py-3 text-sm flex items-center justify-between transition-colors ${isSelected ? 'text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              {role}
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
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

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-20 max-w-md mx-auto">
          {j.selectedJobs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {j.selectedJobs.map(role => {
                const category = JOB_CATEGORIES.find(c => c.roles.includes(role))?.category || '';
                return (
                  <span key={role} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-100">
                    {category} &gt; {role}
                    <button onClick={() => j.removeJob(role)} className="p-0.5 hover:bg-gray-200 rounded-full ml-1">
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={j.clearSelection}
              className="flex-1 py-3.5 border border-gray-300 rounded-lg font-bold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
            >
              選択初期化
            </button>
            <button
              onClick={j.handleSave}
              className="flex-1 py-3.5 rounded-lg font-bold text-white bg-black hover:bg-gray-900 transition-colors"
            >
              適用
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
