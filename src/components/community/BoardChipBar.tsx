import React from 'react';
import { COMMUNITY_BOARDS, getCommunityBoardLabel } from '../../constants/communityBoards';

interface BoardChipBarProps {
  selectedBoard: string;
  onSelectBoard: (boardId: string) => void;
}

export const BoardChipBar: React.FC<BoardChipBarProps> = ({ selectedBoard, onSelectBoard }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 bg-surface border-b border-line">
    <button
      onClick={() => onSelectBoard('all')}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        selectedBoard === 'all' ? 'bg-primary text-white' : 'bg-primary-soft text-ink-muted'
      }`}
    >
      人気投稿
    </button>
    {COMMUNITY_BOARDS.map((board) => (
      <button
        key={board.id}
        onClick={() => onSelectBoard(board.id)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          selectedBoard === board.id ? 'bg-primary text-white' : 'bg-primary-soft text-ink-muted'
        }`}
      >
        {getCommunityBoardLabel(board.id)}
      </button>
    ))}
  </div>
);
