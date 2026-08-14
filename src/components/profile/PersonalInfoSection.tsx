import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../types/app';
import type { PersonalInfoEditor } from '../../hooks/usePersonalInfoEditor';

export const PersonalInfoSection: React.FC<{ userProfile: UserProfile | null; personalInfo: PersonalInfoEditor }> = ({ userProfile, personalInfo: p }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <div>
        <h3 className="font-bold text-ink">人的事項</h3>
        <p className="text-xs text-ink-faint mt-1">採用担当者にのみ公開</p>
      </div>
      <button
        onClick={p.open}
        className="text-ink-muted text-sm flex items-center gap-1"
      >
        編集 <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    <div className="text-sm text-ink-muted space-y-2">
      {userProfile?.birthYear ? (
        <p>• {userProfile.birthYear}年</p>
      ) : (
        <p className="text-ink-faint">• 出生年度未設定</p>
      )}
      {userProfile?.gender ? (
        <p>• {userProfile.gender}</p>
      ) : (
        <p className="text-ink-faint">• 性別未設定</p>
      )}
    </div>
  </div>
);
