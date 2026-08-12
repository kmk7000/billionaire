import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../types/app';
import type { CertificatesEditor } from '../../hooks/useCertificatesEditor';

export const CertificatesSection: React.FC<{ userProfile: UserProfile | null; certificates: CertificatesEditor }> = ({ userProfile, certificates: c }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <h3 className="font-bold text-gray-900">資格証</h3>
      {userProfile?.certificates && userProfile.certificates.length > 0 && (
        <button
          onClick={c.open}
          className="text-gray-500 text-sm flex items-center gap-1"
        >
          編集 <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
    <p className="text-xs text-gray-400 mb-3">採用担当者にのみ公開</p>

    {userProfile?.certificates && userProfile.certificates.length > 0 ? (
      <div className="space-y-2">
        {userProfile.certificates.map((cert, idx) => (
          <p key={idx} className="text-sm text-gray-700">• {cert}</p>
        ))}
      </div>
    ) : (
      <button
        onClick={c.open}
        className="w-full border border-dashed border-gray-300 rounded-lg py-4 text-gray-400 text-sm font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        + 資格証追加
      </button>
    )}
  </div>
);
