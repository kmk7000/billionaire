import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../types/app';
import type { AwardsEditor } from '../../hooks/useAwardsEditor';

export const AwardsSection: React.FC<{ userProfile: UserProfile | null; awards: AwardsEditor }> = ({ userProfile, awards: a }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <h3 className="font-bold text-gray-900">受賞及びその他の履歴</h3>
      {userProfile?.awards && userProfile.awards.length > 0 && (
        <button
          onClick={a.open}
          className="text-gray-500 text-sm flex items-center gap-1"
        >
          編集 <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
    <p className="text-xs text-gray-400 mb-3">採用担当者にのみ公開</p>

    {userProfile?.awards && userProfile.awards.length > 0 ? (
      <div className="space-y-2">
        {userProfile.awards.map((award, idx) => (
          <p key={idx} className="text-sm text-gray-700">• {award}</p>
        ))}
      </div>
    ) : (
      <button
        onClick={a.open}
        className="w-full border border-dashed border-gray-300 rounded-lg py-4 text-gray-400 text-sm font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        + 受賞及びその他の履歴追加
      </button>
    )}
  </div>
);
