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
  getCallerIdStatus, openCallerIdSettings, type CallerIdStatus,
} from '../../native/callerIdIndex';

interface CallerIdInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
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

export const CallerIdInfoSheet: React.FC<CallerIdInfoSheetProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<CallerIdStatus | null>(null);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  const refreshStatus = () => {
    setStatus(null);
    getCallerIdStatus().then(setStatus);
  };

  useEffect(() => {
    if (isOpen) refreshStatus();
  }, [isOpen]);

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
            <div className="flex items-center gap-2 mb-5">
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

            <p className="text-[14px] text-ink leading-relaxed">
              保存した名刺の電話番号からの着信に、会社名とお名前を表示します。
            </p>

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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
