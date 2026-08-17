// Explains and controls "着信時に相手の名刺情報を表示" (caller ID from saved cards).
//
// The feature only exists on iOS, and even there is capped at a one-line text
// label — see src/native/callerIdIndex.ts and the Swift sources under ios/App
// for why iOS allows nothing richer. This sheet states those limits up front
// rather than letting them be discovered as a disappointment: no photo, not
// real-time, and the iOS-side switch can only be flipped by the user.
//
// Two switches have to be on for a call to be identified, and they belong to
// different owners:
//   1. this app's switch  — whether we register the numbers at all (ours)
//   2. the iOS switch     — Settings > 電話 > 通話のブロックと識別 (the user's)
// The sheet shows both, because "it isn't working" has a different fix
// depending on which one is off.

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import {
  getCallerIdState, isCallerIdPlatform, openCallerIdSettings, syncCallerIdEntries,
  type CallerIdState, type CallerIdStatus,
} from '../../native/callerIdIndex';
import { buildCallerIdEntries } from '../../hooks/useCallerIdSync';
import type { Meishi, UserProfile } from '../../types/app';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { useToast } from '../Toast';

interface CallerIdInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  meishis: Meishi[];
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
}

const STATUS_LABEL: Record<CallerIdStatus, string> = {
  enabled: '有効',
  disabled: '無効',
  unknown: '未確認',
};

const STATUS_CLASS: Record<CallerIdStatus, string> = {
  enabled: 'bg-success/10 text-success',
  disabled: 'bg-danger/10 text-danger',
  unknown: 'bg-primary-soft text-ink-faint',
};

export const CallerIdInfoSheet: React.FC<CallerIdInfoSheetProps> = ({
  isOpen, onClose, meishis, user, userProfile,
}) => {
  const toast = useToast();
  const [state, setState] = useState<CallerIdState | null>(null);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTogglingApp, setIsTogglingApp] = useState(false);

  // Absent means on: the feature shipped before this switch existed, and
  // turning it off for everyone who never opted out would be a silent
  // regression of something that already worked for them.
  const appEnabled = userProfile?.callerIdEnabled !== false;

  const status: CallerIdStatus | null = state ? state.status : null;
  // How many numbers this device *would* register, versus how many actually
  // made it across. A gap between the two is the tell for a broken hand-off.
  const expectedCount = buildCallerIdEntries(meishis).length;

  const refreshStatus = () => {
    setState(null);
    getCallerIdState().then(setState);
  };

  useEffect(() => {
    if (isOpen) refreshStatus();
  }, [isOpen]);

  const handleToggleApp = async () => {
    if (!user) return;
    const next = !appEnabled;
    setIsTogglingApp(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { callerIdEnabled: next });
      // useCallerIdSync reacts to the profile change and rewrites the index —
      // empty when switching off, the full list when switching back on. Give
      // it a moment before re-reading, or the count shown is the old one.
      toast.success(next ? '着信時の表示をオンにしました。' : '着信時の表示をオフにしました。');
      setTimeout(refreshStatus, 1200);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('設定を保存できませんでした。通信状況をご確認ください。');
    } finally {
      setIsTogglingApp(false);
    }
  };

  // The background sync runs on card changes and stays quiet about failures.
  // This is where the user comes when it is not working, so here it speaks up.
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const result = await syncCallerIdEntries(appEnabled ? buildCallerIdEntries(meishis) : []);
      // Storing and loading are separate outcomes; saying "registered" when
      // iOS refused the reload would overstate what happened.
      toast.success(result.reloaded
        ? `${result.count}件の電話番号を登録しました。`
        : `${result.count}件を保存しました。iOS側の設定をオンにすると反映されます。`);
      refreshStatus();
    } catch (error: any) {
      toast.error(`同期に失敗しました。\n${error?.message || error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Left-edge swipe goes back, same as the arrow.
  useSwipeBack(onClose, isOpen);

  const handleOpenSettings = async () => {
    setIsOpeningSettings(true);
    try {
      await openCallerIdSettings();
    } finally {
      setIsOpeningSettings(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          <header className="sticky top-0 z-10 bg-surface border-b border-line h-[52px] flex items-center px-4 gap-3">
            <button aria-label="戻る" onClick={onClose} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">着信時に相手の名刺情報を表示</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
            <p className="text-[14px] text-ink leading-relaxed">
              保存した名刺の電話番号からの着信に、会社名とお名前を表示します。
              名刺に携帯電話と電話番号の両方が登録されている場合は、どちらからの着信でも表示されます。
            </p>

            {!isCallerIdPlatform ? (
              // Shown rather than hidden: the feature is real, it just lives on
              // another device. Hiding it here means a web user never learns it
              // exists — but the controls stay out, because none of them would
              // do anything from this browser.
              <div className="mt-5 rounded-lg border border-line bg-canvas p-4">
                <p className="text-[13px] font-bold text-ink mb-1">iOSアプリ専用の機能です</p>
                <p className="text-[13px] text-ink-muted leading-relaxed">
                  着信画面はスマートフォンのOSが表示するため、ブラウザからは利用できません。
                  iPhoneのBillionaireアプリからオンにしてください。Android版は現在準備中です。
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-lg border border-line p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-ink">この機能を使う</p>
                      <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">
                        オフにすると、登録済みの電話番号を端末から削除します。
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={appEnabled}
                      aria-label="この機能を使う"
                      disabled={isTogglingApp || !user}
                      onClick={handleToggleApp}
                      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 disabled:opacity-60 ${
                        appEnabled ? 'bg-primary' : 'bg-primary-soft'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform ${
                          appEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-ink-muted">iOS側の設定</span>
                      {status === null ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-faint" />
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[12px] font-bold ${STATUS_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      )}
                      <button
                        aria-label="状態を再確認"
                        onClick={refreshStatus}
                        className="ml-auto p-1.5 rounded-lg hover:bg-canvas transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 text-ink-faint" />
                      </button>
                    </div>
                    {state && (
                      <p className="mt-1 text-[12px] text-ink-muted tabular-nums">
                        登録済み {state.entryCount}件 / 対象 {appEnabled ? expectedCount : 0}件
                      </p>
                    )}
                  </div>
                </div>

                {/* Each of these is a different fault with a different fix, so
                    they are never collapsed into one generic failure message. */}
                {state && !state.available && (
                  <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3.5">
                    <p className="text-[13px] font-bold text-danger mb-1">この端末では利用できません</p>
                    <p className="text-[13px] text-ink-muted leading-relaxed">
                      アプリが着信表示の機能を読み込めませんでした。アプリを最新版に更新してからお試しください。
                    </p>
                  </div>
                )}

                {state && state.available && !state.appGroupAvailable && (
                  <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3.5">
                    <p className="text-[13px] font-bold text-danger mb-1">端末側の設定が未完了です</p>
                    <p className="text-[13px] text-ink-muted leading-relaxed">
                      アプリと拡張機能の間でデータを共有できていないため、電話番号を登録できません。
                      アプリの再インストールで解消しない場合は、お問い合わせください。
                    </p>
                  </div>
                )}

                {state && state.available && state.appGroupAvailable
                  && appEnabled && state.entryCount < expectedCount && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3.5">
                    <p className="text-[13px] text-ink-muted leading-relaxed">
                      まだ登録されていない番号があります。「名刺を今すぐ同期」をお試しください。
                    </p>
                  </div>
                )}

                {state?.status === 'disabled' && appEnabled && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3.5">
                    <p className="text-[13px] text-ink-muted leading-relaxed">
                      iOSの設定がオフのため、着信時に表示されません。下の手順で有効にしてください。
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-4 bg-canvas rounded-lg p-4 space-y-2">
              <p className="text-[13px] font-bold text-ink">ご利用にあたって</p>
              <ul className="text-[13px] text-ink-muted leading-relaxed list-disc pl-4 space-y-1">
                <li>iOSの仕様上、表示できるのは会社名・お名前のみです（写真は表示されません）。</li>
                <li>保存内容の反映はiOSが端末の状態を見て自動的に行うため、名刺を保存してもすぐには反映されない場合があります。</li>
                {/* The steps this refers to are iOS-only, so off iOS the
                    sentence has to stand on its own. */}
                <li>
                  本機能はセキュリティ上の理由から、アプリからiOS側の設定を自動でオンにすることはできません。
                  {isCallerIdPlatform && '下の手順でご自身の端末設定から有効にしてください。'}
                </li>
              </ul>
            </div>

            {isCallerIdPlatform && (
              <div className="mt-5">
                <p className="text-[13px] font-bold text-ink mb-2">iOS側の設定を有効にする手順</p>
                <ol className="text-[13px] text-ink-muted leading-relaxed list-decimal pl-4 space-y-1">
                  <li>下の「設定アプリを開く」をタップ</li>
                  <li>「電話」を開く</li>
                  <li>「通話のブロックと識別」を開く</li>
                  <li>「Billionaire」をオンにする</li>
                </ol>
              </div>
            )}
          </div>

          {isCallerIdPlatform && (
            <div className="p-5 border-t border-line bg-surface pb-safe">
              <button
                onClick={handleOpenSettings}
                disabled={isOpeningSettings}
                className="w-full py-4 rounded-lg font-bold bg-primary text-white hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isOpeningSettings
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Settings2 className="w-4 h-4" />}
                設定アプリを開く
              </button>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || !appEnabled}
                className="w-full mt-2 py-3.5 rounded-lg font-bold border border-line text-ink hover:bg-canvas transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
                名刺を今すぐ同期
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
