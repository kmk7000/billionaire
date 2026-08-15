// Sign-in for the operator console.
//
// In production this page is its own origin, so it does not inherit the app's
// Firebase session and needs its own sign-in. Signing in here proves identity;
// it does not grant access — `isAdmin()` in firestore.rules decides that, and a
// member who signs in correctly still sees nothing but the refusal screen.

import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Loader2, Lock } from 'lucide-react';
import { auth } from '../firebase';
import { Button } from './ui';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Auth errors are deliberately not distinguished — a precise message here
      tells an attacker which half of the pair was right. */
  const fail = () => setError('メールアドレスまたはパスワードが正しくありません。');

  const submit = async (event: any) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setIsBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      fail();
    } finally {
      setIsBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError('Googleログインに失敗しました。');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-ink-muted" />
          <span className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">
            Operator access
          </span>
        </div>
        <h1 className="text-[26px] font-bold text-ink tracking-tight mb-1">管理コンソール</h1>
        <p className="text-[13px] text-ink-muted leading-relaxed mb-6">
          Billionaire の運営者専用画面です。一般会員のアカウントではご利用いただけません。
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="admin-email" className="block text-[12px] font-bold text-ink mb-1.5">
              メールアドレス
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-surface border border-line rounded-md px-3 text-[14px] text-ink focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-[12px] font-bold text-ink mb-1.5">
              パスワード
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-surface border border-line rounded-md px-3 text-[14px] text-ink focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="text-[12px] text-danger leading-relaxed">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isBusy || !email.trim() || !password}
            className="w-full h-11 rounded-md bg-primary text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:bg-primary-soft disabled:text-ink-faint disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
            ログインする
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <span className="flex-1 h-px bg-line" />
          <span className="text-[11px] text-ink-faint">または</span>
          <span className="flex-1 h-px bg-line" />
        </div>

        <div className="[&>button]:w-full [&>button]:h-11">
          <Button onClick={signInWithGoogle} disabled={isBusy}>
            Google アカウントでログイン
          </Button>
        </div>
      </div>
    </main>
  );
};
