import React, { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';

export const TermsAgreement: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [agreements, setAgreements] = useState({
    all: false,
    age: false,
    tos: false,
    privacyRequired: false,
    privacyOptional: false,
    marketing: false,
  });

  const handleToggleAll = () => {
    const newValue = !agreements.all;
    setAgreements({
      all: newValue,
      age: newValue,
      tos: newValue,
      privacyRequired: newValue,
      privacyOptional: newValue,
      marketing: newValue,
    });
  };

  const handleToggle = (key: keyof typeof agreements) => {
    if (key === 'all') return;
    const nextAgreements = { ...agreements, [key]: !agreements[key] };
    const allChecked = nextAgreements.age && nextAgreements.tos && nextAgreements.privacyRequired && nextAgreements.privacyOptional && nextAgreements.marketing;
    setAgreements({ ...nextAgreements, all: allChecked });
  };

  const canProceed = agreements.age && agreements.tos && agreements.privacyRequired;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl relative pt-safe">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h2 className="font-bold text-gray-900 mb-8 terms-heading">
          利用規約に同意してください
        </h2>

        <div 
          onClick={handleToggleAll}
          className={`p-5 border rounded-xl mb-8 flex items-center gap-3 cursor-pointer transition-colors ${agreements.all ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${agreements.all ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
            <Check className={`w-4 h-4 transition-colors ${agreements.all ? 'text-white' : 'text-gray-300'}`} />
          </div>
          <span className="font-bold text-gray-900">すべてに同意します</span>
        </div>

        <div className="space-y-6">
          {[
            { key: 'age', label: '(必須) 14歳以上です', required: true },
            { key: 'tos', label: '(必須) サービス利用規約', required: true, hasDetail: true },
            { key: 'privacyRequired', label: '(必須) 個人情報の収集および利用', required: true, hasDetail: true },
            { key: 'privacyOptional', label: '(任意) 個人情報の収集および利用', required: false, hasDetail: true },
            { key: 'marketing', label: '(任意) イベント等の特典・情報の受信', required: false, hasDetail: true },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between group cursor-pointer" onClick={() => handleToggle(item.key as any)}>
              <div className="flex items-center gap-3">
                <Check className={`w-4 h-4 transition-colors ${agreements[item.key as keyof typeof agreements] ? 'text-gray-900' : 'text-gray-300'}`} />
                <span className={`text-sm ${agreements[item.key as keyof typeof agreements] ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>
              {item.hasDetail && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <button
          disabled={!canProceed}
          onClick={onNext}
          className={`w-full py-4 rounded-xl font-bold transition-colors ${canProceed ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          次へ
        </button>
      </div>
    </div>
  );
};
