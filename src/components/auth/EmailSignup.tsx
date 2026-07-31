import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export const EmailSignup: React.FC<{ onBack: () => void; onComplete: (email: string, pass: string) => void }> = ({ onBack, onComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValid = email.includes('@') && password.length >= 8;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-12">
          使用するメールアドレスを入力し、<br />パスワードを設定してください
        </h2>

        <div className="space-y-10">
          <div className="relative border-b border-gray-200 pb-2">
            <label className="absolute -top-6 left-0 text-xs font-bold text-gray-400">メールアドレス</label>
            <input
              type="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-200"
            />
          </div>

          <div className="relative border-b border-gray-200 pb-2">
            <label className="absolute -top-6 left-0 text-xs font-bold text-gray-400">パスワード</label>
            <input
              type="password"
              placeholder="8文字以上入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <button
          disabled={!isValid}
          onClick={() => onComplete(email, password)}
          className={`w-full py-4 rounded-xl font-bold transition-colors ${isValid ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
        >
          登録する
        </button>
      </div>
    </div>
  );
};
