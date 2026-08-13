import React from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import { COMMUNITY_BOARDS, getCommunityBoardLabel } from '../../constants/communityBoards';

interface BoardSidebarProps {
  selectedBoard: string;
  onSelectBoard: (boardId: string) => void;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({ selectedBoard, onSelectBoard }) => (
  <div className="bg-white p-3 space-y-1">
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
      関心事・テーマ
    </p>
    <button
      onClick={() => onSelectBoard('all')}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
        selectedBoard === 'all' ? 'bg-[#0A0A0A] text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Flame className="w-4 h-4 opacity-80" />
        <span>人気投稿</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
    </button>
    {COMMUNITY_BOARDS.map((board) => (
      <button
        key={board.id}
        onClick={() => onSelectBoard(board.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
          selectedBoard === board.id ? 'bg-[#0A0A0A] text-white' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>{getCommunityBoardLabel(board.id)}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
      </button>
    ))}
  </div>
);
