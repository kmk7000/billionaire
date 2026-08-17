import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface SimpleLoginSettingsProps {
  onBack: () => void;
}

const SimpleLoginSettings: React.FC<SimpleLoginSettingsProps> = ({ onBack }) => {
  const [logins, setLogins] = useState({
    google: true,
    apple: true,
    line: false,
  });

  const toggleLogin = (key: keyof typeof logins) => {
    setLogins(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const loginMethods = [
    { key: 'google', label: 'Googleでログイン' },
    { key: 'apple', label: 'Appleでログイン' },
    { key: 'line', label: 'LINEでログイン' },
  ] as const;

  // Left-edge swipe goes back, same as the arrow.
  useSwipeBack(onBack);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-surface z-[1000] flex flex-col pt-safe"
    >
      <div className="sticky top-0 bg-surface px-4 py-3 flex items-center border-b border-line">
        <button aria-label="戻る" onClick={onBack} className="p-2 -ml-2 text-ink">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-ink ml-2">簡単ログイン設定</h2>
      </div>

      <div className="flex-1 px-6 pt-6">
        <div className="space-y-6">
          {loginMethods.map((method) => (
            <div key={method.key} className="flex items-center justify-between">
              <span className="text-[16px] font-medium text-ink">{method.label}</span>
              <button
                onClick={() => toggleLogin(method.key)}
                className={`w-12 h-7 rounded-full transition-colors relative ${logins[method.key] ? 'bg-primary' : 'bg-primary-soft'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-surface transition-transform ${logins[method.key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SimpleLoginSettings;
