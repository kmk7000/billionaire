import React from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import { COMMUNITY_BOARDS, getCommunityBoardLabel } from '../../constants/communityBoards';

interface BoardSidebarProps {
  selectedBoard: string;
  onSelectBoard: (boardId: string) => void;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({ selectedBoard, onSelectBoard }) => (
  <div className="bg-surface p-3 space-y-1">
    <p className="text-[11px] font-bold text-ink-faint uppercase tracking-wider px-3 py-1">
      関心事・テーマ
    </p>
    <button
      onClick={() => onSelectBoard('all')}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
        selectedBoard === 'all' ? 'bg-primary text-white' : 'text-ink-muted hover:bg-primary-soft'
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
          selectedBoard === board.id ? 'bg-primary text-white' : 'text-ink-muted hover:bg-primary-soft'
        }`}
      >
        <span>{getCommunityBoardLabel(board.id)}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
      </button>
    ))}
  </div>
);
