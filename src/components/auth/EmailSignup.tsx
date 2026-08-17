import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export const EmailSignup: React.FC<{ onBack: () => void; onComplete: (email: string, pass: string) => void }> = ({ onBack, onComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValid = email.includes('@') && password.length >= 8;

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto shadow-2xl pt-safe">
      <div className="p-4">
        <button aria-label="戻る" onClick={onBack} className="p-2.5 -ml-2.5">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h2 className="text-2xl font-bold text-ink leading-tight mb-12">
          使用するメールアドレスを入力し、<br />パスワードを設定してください
        </h2>

        <div className="space-y-10">
          <div className="relative border-b border-line pb-2">
            <label className="absolute -top-6 left-0 text-xs font-bold text-ink-faint">メールアドレス</label>
            <input
              type="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none text-ink placeholder:text-ink-faint"
            />
          </div>

          <div className="relative border-b border-line pb-2">
            <label className="absolute -top-6 left-0 text-xs font-bold text-ink-faint">パスワード</label>
            <input
              type="password"
              placeholder="8文字以上入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-ink placeholder:text-ink-faint"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <button
          disabled={!isValid}
          onClick={() => onComplete(email, password)}
          className={`w-full py-4 rounded-lg font-bold transition-colors ${isValid ? 'bg-primary text-white shadow-lg' : 'bg-primary-soft text-ink-faint'}`}
        >
          登録する
        </button>
      </div>
    </div>
  );
};
