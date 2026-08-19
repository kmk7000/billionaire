import React from 'react';
import { Home, IdCard, Share2, Users, Mail, MessageSquare, MoreHorizontal } from 'lucide-react';
import type { Tab } from '../../types/app';

interface BottomNavProps {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
  isEditMode: boolean;
  onOpenMoreMenu: () => void;
  /** Files the current 名刺帳 selection into a group. Only meaningful with
      a non-empty selection — MeishiListScreen's checkboxes are what fill it. */
  onOpenGroupAssign: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, isEditMode, onOpenMoreMenu, onOpenGroupAssign }) => (
  !isEditMode ? (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/70 backdrop-blur-xl backdrop-saturate-150 border-t border-line/60 flex justify-around items-center py-2 px-2 z-20 pb-safe lg:hidden">
      <button
        onClick={() => onChangeTab('today')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'today' ? 'text-ink' : 'text-ink-faint'}`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">トゥデイ</span>
      </button>
      <button
        onClick={() => onChangeTab('meishi')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'meishi' ? 'text-ink' : 'text-ink-faint'}`}
      >
        <IdCard className="w-6 h-6" />
        <span className="text-[10px] font-medium">名刺帳</span>
      </button>
      <button
        onClick={() => onChangeTab('community')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'community' ? 'text-ink' : 'text-ink-faint'}`}
      >
        <Share2 className="w-6 h-6" />
        <span className="text-[10px] font-medium">コミュニティ</span>
      </button>
    </nav>
  ) : (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-primary/80 backdrop-blur-xl backdrop-saturate-150 text-white flex justify-around items-center py-2 px-2 z-20 pb-safe lg:hidden">
      <button
        onClick={onOpenGroupAssign}
        className="flex flex-col items-center gap-1 flex-1 py-1 text-white/60 hover:text-white transition-colors"
      >
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium">グループ</span>
      </button>
      <button className="flex flex-col items-center gap-1 flex-1 py-1 text-white/60 hover:text-white transition-colors">
        <Mail className="w-6 h-6" />
        <span className="text-[10px] font-medium">メール</span>
      </button>
      <button className="flex flex-col items-center gap-1 flex-1 py-1 text-white/60 hover:text-white transition-colors">
        <MessageSquare className="w-6 h-6" />
        <span className="text-[10px] font-medium">メッセージ</span>
      </button>
      <button
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center gap-1 flex-1 py-1 text-white/60 hover:text-white transition-colors"
      >
        <MoreHorizontal className="w-6 h-6" />
        <span className="text-[10px] font-medium">その他</span>
      </button>
    </nav>
  )
);
