import React from 'react';
import { Home, IdCard, Share2, Users, Mail, MessageSquare, MoreHorizontal } from 'lucide-react';
import type { Tab } from '../../types/app';

interface BottomNavProps {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
  isEditMode: boolean;
  onOpenMoreMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, isEditMode, onOpenMoreMenu }) => (
  !isEditMode ? (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around items-center py-2 px-2 z-20 pb-safe lg:hidden">
      <button
        onClick={() => onChangeTab('today')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'today' ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">トゥデイ</span>
      </button>
      <button
        onClick={() => onChangeTab('meishi')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'meishi' ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <IdCard className="w-6 h-6" />
        <span className="text-[10px] font-medium">名刺帳</span>
      </button>
      <button
        onClick={() => onChangeTab('community')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'community' ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <Share2 className="w-6 h-6" />
        <span className="text-[10px] font-medium">コミュニティ</span>
      </button>
    </nav>
  ) : (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-900 text-white flex justify-around items-center py-2 px-2 z-20 pb-safe lg:hidden">
      <button className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors">
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium">グループ</span>
      </button>
      <button className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors">
        <Mail className="w-6 h-6" />
        <span className="text-[10px] font-medium">メール</span>
      </button>
      <button className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors">
        <MessageSquare className="w-6 h-6" />
        <span className="text-[10px] font-medium">メッセージ</span>
      </button>
      <button
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors"
      >
        <MoreHorizontal className="w-6 h-6" />
        <span className="text-[10px] font-medium">その他</span>
      </button>
    </nav>
  )
);
