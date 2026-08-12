import React from 'react';
import { COMMUNITY_BOARDS, getCommunityBoardLabel } from '../../constants/communityBoards';

interface BoardChipBarProps {
  selectedBoard: string;
  onSelectBoard: (boardId: string) => void;
}

export const BoardChipBar: React.FC<BoardChipBarProps> = ({ selectedBoard, onSelectBoard }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 bg-white border-b border-gray-100">
    <button
      onClick={() => onSelectBoard('all')}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        selectedBoard === 'all' ? 'bg-[#0A0A0A] text-white' : 'bg-gray-100 text-gray-600'
      }`}
    >
      人気投稿
    </button>
    {COMMUNITY_BOARDS.map((board) => (
      <button
        key={board.id}
        onClick={() => onSelectBoard(board.id)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          selectedBoard === board.id ? 'bg-[#0A0A0A] text-white' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {getCommunityBoardLabel(board.id)}
      </button>
    ))}
  </div>
);
