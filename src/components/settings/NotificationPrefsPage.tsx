import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import type { UserProfile } from '../../types/app';
import { useToast } from '../Toast';
import { SettingsSubPage } from './SettingsSubPage';

// 通知管理. Stores preferences on users/{uid}.notificationPrefs.
//
// Nothing sends notifications yet — that needs a server (see CLAUDE.md item 8,
// push delivery is still unbuilt). These toggles are still worth having now:
// they are what the sender will read when it exists, and the copy says plainly
// that delivery has not started, rather than implying notifications are
// already flowing.

export interface NotificationPrefs {
  communityReplies: boolean;
  communityLikes: boolean;
  cardUpdates: boolean;
  marketing: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  communityReplies: true,
  communityLikes: true,
  cardUpdates: true,
  marketing: false,
};

const ROWS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'communityReplies', label: 'コメント・返信', description: '自分の投稿にコメントがついたとき' },
  { key: 'communityLikes', label: 'いいね', description: '自分の投稿にいいねがついたとき' },
  { key: 'cardUpdates', label: '名刺の更新', description: '交換した相手が名刺を更新したとき' },
  { key: 'marketing', label: 'お得な情報・イベント', description: '新機能やキャンペーンのご案内' },
];

export const NotificationPrefsPage: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
}> = ({ isOpen, onClose, user, userProfile }) => {
  const toast = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Re-seed from the profile whenever the page opens, so it never shows a
  // stale toggle after the document changed elsewhere.
  useEffect(() => {
    if (!isOpen) return;
    setPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(userProfile?.notificationPrefs || {}) });
  }, [isOpen, userProfile]);

  const toggle = async (key: keyof NotificationPrefs) => {
    if (!user) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);                    // optimistic: the switch must feel instant
    setSavingKey(key);
    try {
      await updateDoc(doc(db, 'users', user.uid), { notificationPrefs: next });
    } catch (error) {
      setPrefs(prefs);                 // put it back if the write failed
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('設定を保存できませんでした。通信状況をご確認ください。');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <SettingsSubPage isOpen={isOpen} onClose={onClose} title="通知管理">
      <p className="px-5 pt-5 pb-1 text-[13px] text-ink-muted leading-relaxed">
        プッシュ通知の配信は現在準備中です。ここでの設定は、配信開始時にそのまま適用されます。
      </p>

      <div className="px-5 py-2">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-4 py-4 border-b border-line last:border-b-0">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-ink">{row.label}</p>
              <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">{row.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[row.key]}
              aria-label={row.label}
              disabled={savingKey === row.key}
              onClick={() => toggle(row.key)}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 disabled:opacity-60 ${
                prefs[row.key] ? 'bg-primary' : 'bg-primary-soft'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform ${
                  prefs[row.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {savingKey === row.key && (
                <Loader2 className="w-3 h-3 animate-spin text-ink-faint absolute -left-5 top-2" />
              )}
            </button>
          </div>
        ))}
      </div>
    </SettingsSubPage>
  );
};
