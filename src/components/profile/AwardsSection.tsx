import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../types/app';
import type { AwardsEditor } from '../../hooks/useAwardsEditor';

export const AwardsSection: React.FC<{ userProfile: UserProfile | null; awards: AwardsEditor }> = ({ userProfile, awards: a }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <h3 className="font-bold text-ink">受賞及びその他の履歴</h3>
      {userProfile?.awards && userProfile.awards.length > 0 && (
        <button
          onClick={a.open}
          className="text-ink-muted text-sm flex items-center gap-1"
        >
          編集 <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
    <p className="text-xs text-ink-faint mb-3">採用担当者にのみ公開</p>

    {userProfile?.awards && userProfile.awards.length > 0 ? (
      <div className="space-y-2">
        {userProfile.awards.map((award, idx) => (
          <p key={idx} className="text-sm text-ink-muted">• {award}</p>
        ))}
      </div>
    ) : (
      <button
        onClick={a.open}
        className="w-full border border-dashed border-line rounded-lg py-4 text-ink-faint text-sm font-medium flex items-center justify-center hover:bg-canvas transition-colors"
      >
        + 受賞及びその他の履歴追加
      </button>
    )}
  </div>
);
