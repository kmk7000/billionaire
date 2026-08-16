// 設定 > 携帯電話番号変更. Stores the account's own mobile number on
// users/{uid}.phone as domestic digits (`09012345678`), formatted for display.
//
// There is no SMS ownership check yet: Firebase Phone Auth has to be enabled in
// the Firebase console before any code here could verify anything, so the
// number is self-declared for now. The copy says so rather than letting the
// screen imply a verification that never happens — the same reason 通知管理
// states that delivery has not started.

import React, { useEffect, useState } from 'react';
import { Loader2, Phone } from 'lucide-react';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import type { UserProfile } from '../../types/app';
import {
  formatMobileNumber, toDomesticDigits, validateMobileNumber,
} from '../../utils/mobileNumber';
import { useToast } from '../Toast';
import { SettingsSubPage } from './SettingsSubPage';

export const PhoneNumberPage: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
}> = ({ isOpen, onClose, user, userProfile }) => {
  const toast = useToast();
  // Narrowed rather than trusted: the profile is a cast of Firestore data, so
  // anything could be sitting on this field. Everything below assumes a string.
  const saved = typeof userProfile?.phone === 'string' ? userProfile.phone : '';
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  // Re-seed on open so the field never shows a stale draft from last time, or
  // a number that changed on another device while this page sat closed.
  useEffect(() => {
    if (!isOpen) return;
    setDigits(saved);
    setError(null);
    setIsConfirmingRemove(false);
  }, [isOpen, saved]);

  const handleChange = (value: string) => {
    setDigits(toDomesticDigits(value));
    // Clearing on edit, and re-validating only on submit/blur, keeps the error
    // from firing at every keystroke while the number is still half-typed.
    if (error) setError(null);
  };

  const isUnchanged = digits === saved;

  const handleSave = async () => {
    if (!user) return;
    const problem = validateMobileNumber(digits);
    if (problem) {
      setError(problem);
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { phone: digits });
      toast.success('携帯電話番号を変更しました。');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('保存できませんでした。通信状況をご確認ください。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setIsRemoving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { phone: deleteField() });
      toast.success('携帯電話番号の登録を解除しました。');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('解除できませんでした。通信状況をご確認ください。');
    } finally {
      setIsRemoving(false);
      setIsConfirmingRemove(false);
    }
  };

  const isBusy = isSaving || isRemoving;

  return (
    <SettingsSubPage isOpen={isOpen} onClose={onClose} title="携帯電話番号変更">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 pb-5 border-b border-line">
          <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] text-ink-muted">現在登録されている番号</p>
            <p className="text-[16px] font-bold text-ink tabular-nums">
              {saved ? formatMobileNumber(saved) : '未登録'}
            </p>
          </div>
        </div>

        <label htmlFor="mobile-number" className="block mt-6 text-[13px] font-bold text-ink">
          新しい携帯電話番号
        </label>
        <input
          id="mobile-number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="090-1234-5678"
          value={formatMobileNumber(digits)}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setError(digits ? validateMobileNumber(digits) : null)}
          disabled={isBusy}
          aria-invalid={!!error}
          aria-describedby={error ? 'mobile-number-error' : 'mobile-number-help'}
          className={`w-full mt-2 h-12 px-4 rounded-lg border text-[16px] text-ink tabular-nums bg-surface
            focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
              error ? 'border-danger' : 'border-line focus:border-primary'
            }`}
        />
        {error ? (
          <p id="mobile-number-error" role="alert" className="mt-2 text-[13px] text-danger leading-relaxed">
            {error}
          </p>
        ) : (
          <p id="mobile-number-help" className="mt-2 text-[13px] text-ink-muted leading-relaxed">
            ハイフンありなし、どちらでも入力できます。
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={isBusy || isUnchanged || !digits}
          className="w-full mt-6 py-4 rounded-lg font-bold bg-primary text-white hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved ? '変更する' : '登録する'}
        </button>

        {saved && (
          <div className="mt-3">
            {isConfirmingRemove ? (
              <div className="rounded-lg border border-line p-4">
                <p className="text-[13px] text-ink leading-relaxed">
                  登録を解除すると、アカウントから携帯電話番号が削除されます。よろしいですか？
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setIsConfirmingRemove(false)}
                    disabled={isBusy}
                    className="flex-1 py-3 rounded-lg font-bold border border-line text-ink hover:bg-canvas transition-colors disabled:opacity-60"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={isBusy}
                    className="flex-1 py-3 rounded-lg font-bold bg-danger text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isRemoving && <Loader2 className="w-4 h-4 animate-spin" />}
                    解除する
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingRemove(true)}
                disabled={isBusy}
                className="w-full py-3.5 rounded-lg font-bold text-danger hover:bg-canvas transition-colors disabled:opacity-60"
              >
                登録を解除する
              </button>
            )}
          </div>
        )}

        <div className="mt-6 bg-canvas rounded-lg p-4">
          <p className="text-[12px] text-ink-muted leading-relaxed">
            登録した番号はアカウントの連絡先として保存され、他の会員に公開されることはありません。
            SMSによる本人確認は現在準備中です。
          </p>
        </div>
      </div>
    </SettingsSubPage>
  );
};
