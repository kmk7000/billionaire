import React from 'react';
import { ChevronDown, MapPin, ArrowUpDown, X, Edit3, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Meishi } from '../types/app';
import { MeishiCard } from '../components/meishi/MeishiCard';

interface MeishiListScreenProps {
  activeMeishiTab: 'my' | 'team' | 'group';
  meishis: Meishi[];
  sortedMeishis: Meishi[];
  meishiSortOrder: 'desc' | 'asc';
  onToggleSortOrder: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  selectedMeishis: string[];
  onToggleSelect: (id: string) => void;
  onSelectMeishi: (meishi: Meishi) => void;
  onOpenMap: () => void;
  onOpenCamera: () => void;
}

export const MeishiListScreen: React.FC<MeishiListScreenProps> = ({
  activeMeishiTab,
  meishis,
  sortedMeishis,
  meishiSortOrder,
  onToggleSortOrder,
  isEditMode,
  onToggleEditMode,
  selectedMeishis,
  onToggleSelect,
  onSelectMeishi,
  onOpenMap,
  onOpenCamera,
}) => (
  <motion.div
    key="meishi"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex flex-col"
  >
    {/* Meishi Content based on active tab */}
    {activeMeishiTab === 'team' ? (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          大切な会社の営業資産、<br />チーム名刺帳で管理しましょう！
        </h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          役職員の変動があっても紛失することなく<br />安全に管理できます。
        </p>
        <div className="bg-gray-100 text-gray-500 font-bold py-2 px-6 rounded-full text-sm">
          準備中
        </div>
      </div>
    ) : activeMeishiTab === 'group' ? (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white flex-1">
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          グループ連絡先
        </p>
        <div className="bg-gray-100 text-gray-500 font-bold py-2 px-6 rounded-full text-sm">
          準備中
        </div>
      </div>
    ) : (
      <>
        {/* Filter Bar */}
        <div className="px-4 py-1.5 h-[35px] flex justify-between items-center bg-white border-b border-gray-100">
          <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
            <span>すべて ({meishis.length})</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1 hover:text-[#0A0A0A] transition-colors"
            >
              <MapPin className="w-3 h-3" />
              <span>地図</span>
            </button>
            <button
              onClick={onToggleSortOrder}
              className="flex items-center gap-1 hover:text-[#0A0A0A] transition-colors"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>登録日順 {meishiSortOrder === 'desc' ? '↓' : '↑'}</span>
            </button>
            <button
              onClick={onToggleEditMode}
              className={`flex items-center gap-1 transition-colors ${isEditMode ? 'text-[#0A0A0A]' : 'hover:text-[#0A0A0A]'}`}
            >
              {isEditMode ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              <span>{isEditMode ? 'キャンセル' : '編集'}</span>
            </button>
          </div>
        </div>

        {/* Meishi List */}
        <div className="flex flex-col bg-white">
          {sortedMeishis.length > 0 ? (
            sortedMeishis.map(m => (
              <MeishiCard
                key={m.id}
                meishi={m}
                isEditMode={isEditMode}
                isSelected={selectedMeishis.includes(m.id)}
                onSelect={onToggleSelect}
                onClick={onSelectMeishi}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400">名刺をスキャンして<br />ネットワークを広げましょう</p>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {!isEditMode && (
          <button
            onClick={onOpenCamera}
            className="fixed bottom-24 right-4 bg-[#0A0A0A] hover:bg-black text-white px-5 py-3.5 rounded-full shadow-xl flex items-center gap-2 font-bold active:scale-95 transition-transform z-20"
          >
            <Plus className="w-5 h-5" />
            <span>名刺登録</span>
          </button>
        )}
      </>
    )}
  </motion.div>
);
