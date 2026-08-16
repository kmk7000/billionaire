// Explains and controls "着信時に相手の名刺情報を表示" (caller ID from saved cards).
//
// iOS only, and even there capped at a one-line text label — see
// src/native/callerIdIndex.ts and the Swift sources under ios/App for the
// full explanation of why iOS allows nothing richer than that. This sheet
// exists so the feature's real limits are stated up front rather than
// discovered as a disappointment: no photo, not real-time, and the user must
// flip it on themselves in iOS Settings because no app can do that for them.

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getCallerIdState, openCallerIdSettings, syncCallerIdEntries,
  type CallerIdState, type CallerIdStatus,
} from '../../native/callerIdIndex';
import { buildCallerIdEntries } from '../../hooks/useCallerIdSync';
import type { Meishi } from '../../types/app';
import { useToast } from '../Toast';

interface CallerIdInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  meishis: Meishi[];
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

export const CallerIdInfoSheet: React.FC<CallerIdInfoSheetProps> = ({ isOpen, onClose, meishis }) => {
  const toast = useToast();
  const [state, setState] = useState<CallerIdState | null>(null);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const status: CallerIdStatus | null = state ? state.status : null;
  // How many numbers this device *would* register, versus how many actually
  // made it across. A gap between the two is the tell for a broken App Group.
  const expectedCount = buildCallerIdEntries(meishis).length;

  const refreshStatus = () => {
    setState(null);
    getCallerIdState().then(setState);
  };

  useEffect(() => {
    if (isOpen) refreshStatus();
  }, [isOpen]);

  // The background sync runs on card changes and stays quiet about failures.
  // This is where the user comes when it is not working, so here it speaks up.
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const count = await syncCallerIdEntries(buildCallerIdEntries(meishis));
      toast.success(`${count}件の電話番号を登録しました。`);
      refreshStatus();
    } catch (error: any) {
      toast.error(`同期に失敗しました。\n${error?.message || error}`);
    } finally {
      setIsSyncing(false);
    }
  };

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
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink-muted">現在の状態</span>
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
                  登録済み {state.entryCount}件 / 対象 {expectedCount}件
                  {/* The extension can only ever match what actually crossed
                      into the shared container, so a shortfall here is the
                      difference between "working" and "silently doing
                      nothing" — and it is fixable from this screen. */}
                  {state.appGroupAvailable && state.entryCount < expectedCount && (
                    <span className="block mt-0.5 text-warning">
                      未登録の番号があります。「名刺を今すぐ同期」をお試しください。
                    </span>
                  )}
                </p>
              )}
            </div>

            <p className="text-[14px] text-ink leading-relaxed">
              保存した名刺の電話番号からの着信に、会社名とお名前を表示します。
              名刺に携帯電話と電話番号の両方が登録されている場合は、どちらからの着信でも表示されます。
            </p>

            {state && !state.appGroupAvailable && (
              <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3.5">
                <p className="text-[13px] font-bold text-danger mb-1">端末側の設定が未完了です</p>
                <p className="text-[13px] text-ink-muted leading-relaxed">
                  アプリと拡張機能の間でデータを共有できていないため、電話番号を登録できません。
                  アプリの再インストールで解消しない場合は、お問い合わせください。
                </p>
              </div>
            )}

            <div className="mt-4 bg-canvas rounded-lg p-4 space-y-2">
              <p className="text-[13px] font-bold text-ink">ご利用にあたって</p>
              <ul className="text-[13px] text-ink-muted leading-relaxed list-disc pl-4 space-y-1">
                <li>iOSの仕様上、表示できるのは会社名・お名前のみです（写真は表示されません）。</li>
                <li>保存内容の反映はiOSが端末の状態を見て自動的に行うため、名刺を保存してもすぐには反映されない場合があります。</li>
                <li>本機能はセキュリティ上の理由から、アプリから自動でオンにすることはできません。下の手順でご自身の端末設定から有効にしてください。</li>
              </ul>
            </div>

            <div className="mt-5">
              <p className="text-[13px] font-bold text-ink mb-2">有効にする手順</p>
              <ol className="text-[13px] text-ink-muted leading-relaxed list-decimal pl-4 space-y-1">
                <li>下の「設定アプリを開く」をタップ</li>
                <li>「電話」を開く</li>
                <li>「通話のブロックと識別」を開く</li>
                <li>「Billionaire」をオンにする</li>
              </ol>
            </div>
          </div>

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
              disabled={isSyncing}
              className="w-full mt-2 py-3.5 rounded-lg font-bold border border-line text-ink hover:bg-canvas transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
              名刺を今すぐ同期
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
