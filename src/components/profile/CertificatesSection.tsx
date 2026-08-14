import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../types/app';
import type { CertificatesEditor } from '../../hooks/useCertificatesEditor';

export const CertificatesSection: React.FC<{ userProfile: UserProfile | null; certificates: CertificatesEditor }> = ({ userProfile, certificates: c }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <h3 className="font-bold text-ink">資格証</h3>
      {userProfile?.certificates && userProfile.certificates.length > 0 && (
        <button
          onClick={c.open}
          className="text-ink-muted text-sm flex items-center gap-1"
        >
          編集 <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
    <p className="text-xs text-ink-faint mb-3">採用担当者にのみ公開</p>

    {userProfile?.certificates && userProfile.certificates.length > 0 ? (
      <div className="space-y-2">
        {userProfile.certificates.map((cert, idx) => (
          <p key={idx} className="text-sm text-ink-muted">• {cert}</p>
        ))}
      </div>
    ) : (
      <button
        onClick={c.open}
        className="w-full border border-dashed border-line rounded-lg py-4 text-ink-faint text-sm font-medium flex items-center justify-center hover:bg-canvas transition-colors"
      >
        + 資格証追加
      </button>
    )}
  </div>
);
