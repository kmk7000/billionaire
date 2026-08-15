import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowLeft, Megaphone, HelpCircle, Headset, Settings, UserCircle, ChevronRight,
  Image as ImageIcon, CreditCard, Phone, BookOpen, ThumbsUp, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';
import SimpleLoginSettings from '../SimpleLoginSettings';
import { InquiryPage } from './InquiryPage';
import { CallerIdInfoSheet } from './CallerIdInfoSheet';
import type { AccountSettings } from '../../hooks/useAccountSettings';
import { useToast } from '../Toast';

// Real (if iOS-only, text-only) as of 2026-08 — see CallerIdInfoSheet for the
// full explanation. Hidden on Android/web rather than shown disabled: there
// is no Android implementation yet, and a visible-but-inert row is exactly
// the false-advertising problem this replaces.
const isCallerIdAvailable = Capacitor.getPlatform() === 'ios';

interface SettingsModalsProps {
  settings: AccountSettings;
  user: FirebaseUser | null;
  onOpenProfileManagement: () => void;
  onOpenAlbumImport: () => void;
  onOpenDirectInput: () => void;
  onOpenNotifications: () => void;
}

/** Share the app; falls back to the clipboard where the Web Share API is absent.
    Takes the notifier as an argument because this lives outside the component
    and so cannot call useToast() itself. */
async function shareApp(onCopied: (message: string) => void) {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const shareData = {
    title: 'Billionaire（ビリオネア）',
    text: '名刺管理とビジネスコミュニティのアプリ「Billionaire」',
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(url);
    onCopied('アプリのリンクをコピーしました。');
  } catch (error) {
    // A user dismissing the share sheet lands here too, so stay quiet.
    console.warn('Share cancelled or failed:', error);
  }
}

export const SettingsModals: React.FC<SettingsModalsProps> = ({
  settings: s, user, onOpenProfileManagement,
  onOpenAlbumImport, onOpenDirectInput, onOpenNotifications,
}) => {
  const toast = useToast();
  const [isCallerIdSheetOpen, setIsCallerIdSheetOpen] = useState(false);

  return (
  <>
    {/* More Page Overlay */}
    <AnimatePresence>
      {s.isMorePageOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[100] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-surface border-b border-line h-[52px] flex items-center px-4 gap-3">
            <button aria-label="戻る" onClick={s.closeMorePage} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">もっと見る</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Top Icons Grid */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-line">
              <button
                onClick={() => { s.closeMorePage(); onOpenNotifications(); }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-ink-muted" />
                </div>
                <span className="text-[11px] font-bold text-ink-muted">お知らせ</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-ink-muted" />
                </div>
                <span className="text-[11px] font-bold text-ink-muted">ヘルプ</span>
              </button>
              <button
                onClick={() => { s.closeMorePage(); s.openInquiry(); }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                  <Headset className="w-6 h-6 text-ink-muted" />
                </div>
                <span className="text-[11px] font-bold text-ink-muted">1:1 お問い合わせ</span>
              </button>
              <button
                onClick={s.openSettingsPage}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                  <Settings className="w-6 h-6 text-ink-muted" />
                </div>
                <span className="text-[11px] font-bold text-ink-muted">設定</span>
              </button>
            </div>

            {/* My Info Section */}
            <div className="py-4">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">マイ情報</h3>
              </div>
              <button
                onClick={() => {
                  s.closeMorePage();
                  onOpenProfileManagement();
                }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="w-6 h-6 text-ink-muted" />
                  <span className="text-[15px] font-bold text-ink">プロフィール管理</span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
            </div>

            {/* Useful Features Section */}
            <div className="py-4">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">便利な機能</h3>
              </div>
              <button
                onClick={() => { s.closeMorePage(); onOpenAlbumImport(); }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-ink-muted" />
                  <span className="text-[15px] font-bold text-ink">アルバムから名刺を取り込む</span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button
                onClick={() => { s.closeMorePage(); onOpenDirectInput(); }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-ink-muted" />
                  <span className="text-[15px] font-bold text-ink">名刺を直接入力</span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              {isCallerIdAvailable && (
                <button
                  onClick={() => { s.closeMorePage(); setIsCallerIdSheetOpen(true); }}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6 text-ink-muted" />
                    <span className="text-[15px] font-bold text-ink">着信時に相手の名刺情報を表示</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </button>
              )}
            </div>

            {/* Other Section */}
            <div className="py-4 mb-8">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">その他</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-ink-muted" />
                  <span className="text-[15px] font-bold text-ink">プロローグ</span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button
                onClick={() => shareApp(toast.success)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-6 h-6 text-ink-muted" />
                  <span className="text-[15px] font-bold text-ink">このアプリを友だちに紹介する</span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Settings Page Overlay */}
    <AnimatePresence>
      {s.isSettingsPageOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[110] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-surface border-b border-line h-[52px] flex items-center px-4 gap-3">
            <button aria-label="戻る" onClick={s.closeSettingsPage} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">設定</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-surface">
            {/* Account Section */}
            <div className="bg-surface border-b border-line">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">アカウント</h3>
              </div>
              <button
                onClick={s.openAccountManagement}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors"
              >
                <span className="text-[15px] font-bold text-ink">アカウント管理</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button
                onClick={s.openPasswordFlow}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors"
              >
                <span className="text-[15px] font-bold text-ink">パスワード再設定</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button
                onClick={s.openSimpleLoginSettings}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors"
              >
                <span className="text-[15px] font-bold text-ink">簡易ログイン設定</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">携帯電話番号変更</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-ink-muted">010-8526-8170</span>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </div>
              </button>
            </div>

            {/* Business Card Section */}
            <div className="bg-surface border-b border-line">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">名刺</h3>
              </div>
              {isCallerIdAvailable && (
                <button
                  onClick={() => setIsCallerIdSheetOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors"
                >
                  <span className="text-[15px] font-bold text-ink">着信時に相手の名刺情報を表示</span>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </button>
              )}
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">携帯電話の連絡先に保存</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">ファイルに書き出し</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">名刺撮影時にマイ名刺を送る</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
            </div>

            {/* General Section */}
            <div className="bg-surface border-b border-line">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">一般</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">通知管理</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">画面テーマ</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-ink-muted">システム設定モード</span>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </div>
              </button>
            </div>

            {/* Other Section */}
            <div className="bg-surface border-b border-line mb-8">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-ink-faint uppercase tracking-wider">その他</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">法的通知</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">パスコードロック設定</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-ink-muted">オフ</span>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-line hover:bg-canvas transition-colors">
                <span className="text-[15px] font-bold text-ink">サーバーと情報を再同期</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
              <button
                onClick={s.handleLogout}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-canvas transition-colors"
              >
                <span className="text-[15px] font-bold text-danger">ログアウト</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Account Management Overlay */}
    <AnimatePresence>
      {s.isAccountManagementOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-surface border-b border-line h-[52px] flex items-center px-4 gap-3">
            <button aria-label="戻る" onClick={s.closeAccountManagement} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">アカウント</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="bg-surface">
              <button
                onClick={s.openAccountChange}
                className="w-full flex items-center justify-between px-4 py-5 border-b border-line hover:bg-canvas transition-colors"
              >
                <span className="text-[16px] font-bold text-ink">アカウント変更</span>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-ink-muted">{user?.email || 'milk454537@gmail.com'}</span>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </div>
              </button>
              <button
                onClick={s.openWithdrawal}
                className="w-full flex items-center justify-between px-4 py-5 border-b border-line hover:bg-canvas transition-colors"
              >
                <span className="text-[16px] font-bold text-ink">Rememberを退会</span>
                <ChevronRight className="w-5 h-5 text-ink-faint" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Withdrawal Overlay */}
    <AnimatePresence>
      {s.isWithdrawalOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[130] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-surface h-[52px] flex items-center px-4">
            <button aria-label="戻る" onClick={s.closeWithdrawal} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4">
            <div className="text-center mb-8">
              <h2 className="text-[24px] font-bold text-ink mb-2">Rememberを退会</h2>
              <p className="text-[14px] text-ink-muted">退会する前に以下の内容を必ずご確認ください</p>
            </div>

            <div className="bg-canvas rounded-lg p-5 mb-8">
              <ul className="space-y-4 text-[13px] text-ink-muted leading-relaxed">
                <li className="flex gap-2">
                  <span className="shrink-0">1.</span>
                  <span>退会すると、登録された連絡先はすべて削除され、復旧することはできません。</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">2.</span>
                  <span>携帯電話番号の変更は、[設定] &gt; [携帯電話番号変更]から可能です。</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">3.</span>
                  <span>アカウント(メール)の変更は、[設定] &gt; [アカウント管理] &gt; [アカウント変更]から可能です。</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">4.</span>
                  <span>チーム名刺帳組織の管理者は、組織を削除するか管理者を委譲した後に退会できます。</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">5.</span>
                  <span>キャリア人材検索チームアカウントの管理者は、チームアカウントを削除した後に退会できます。</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">6.</span>
                  <span>もし利用過程で不便な点がございましたら、[1:1お問い合わせ]に内容を残してください。</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-3 mb-10">
              <button aria-label="退会に同意する"
                onClick={s.toggleWithdrawalChecked}
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${s.isWithdrawalChecked ? 'bg-primary/50 border-primary' : 'border-line bg-surface'}`}
              >
                <Check className={`w-4 h-4 ${s.isWithdrawalChecked ? 'text-white' : 'text-transparent'}`} />
              </button>
              <span className="text-[15px] font-bold text-ink">すべて削除して退会します</span>
            </div>

            <button
              disabled={!s.isWithdrawalChecked}
              onClick={s.handleWithdraw}
              className={`w-full py-4 rounded-lg text-[16px] font-bold transition-colors ${s.isWithdrawalChecked ? 'bg-danger text-white' : 'bg-primary-soft text-ink-faint'}`}
            >
              退会する
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Password Change Overlay */}
    <AnimatePresence>
      {s.isPasswordChangeOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          <header className="sticky top-0 z-10 bg-surface h-[52px] flex items-center px-4 gap-3 border-b border-line">
            <button aria-label="戻る" onClick={s.closePasswordChange} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">パスワード再設定</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink">現在のパスワード *</label>
                <input
                  type="password"
                  value={s.currentPassword}
                  onChange={(e) => s.setCurrentPassword(e.target.value)}
                  placeholder="現在のパスワード入力"
                  className="w-full h-[48px] px-4 border border-line rounded-md bg-canvas text-[15px] focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink">新しいパスワード *</label>
                <input
                  type="password"
                  value={s.password}
                  onChange={(e) => s.setPassword(e.target.value)}
                  placeholder="新しいパスワード入力"
                  className="w-full h-[48px] px-4 border border-line rounded-md bg-canvas text-[15px] focus:outline-none focus:border-black"
                />
                <p className="text-[13px] text-ink-muted">
                  英数字・記号のうち2種類以上を組み合わせて8文字以上で入力してください。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink">新しいパスワード再入力 *</label>
                <input
                  type="password"
                  value={s.confirmPassword}
                  onChange={(e) => s.setConfirmPassword(e.target.value)}
                  placeholder="新しいパスワード再入力"
                  className="w-full h-[48px] px-4 border border-line rounded-md bg-canvas text-[15px] focus:outline-none focus:border-black"
                />
              </div>

              <button
                onClick={s.handleChangePassword}
                className={`w-full h-[52px] rounded-md text-[16px] font-bold text-white transition-colors ${
                  !s.currentPassword || !s.password || !s.confirmPassword
                    ? 'bg-primary-soft cursor-not-allowed'
                    : 'bg-primary hover:opacity-90'
                }`}
                disabled={!s.currentPassword || !s.password || !s.confirmPassword}
              >
                パスワード再設定
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {s.isPasswordResetSuccessOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-ink/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface rounded-xl w-full max-w-[320px] p-8 text-center shadow-2xl"
          >
            <h3 className="text-[18px] font-bold text-ink mb-4">
              パスワードを変更しました
            </h3>
            <p className="text-[14px] text-ink-muted mb-8">
              既存にログインされた他の機器とブラウザでは再度ログインしてください。
            </p>
            <button
              onClick={s.closePasswordResetSuccess}
              className="w-full h-[48px] bg-primary rounded-md text-[16px] font-bold text-white hover:opacity-90 transition-colors"
            >
              確認
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Password Reset Error Popup */}
    <AnimatePresence>
      {s.isPasswordResetErrorOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-ink/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface rounded-xl w-full max-w-[320px] p-8 text-center shadow-2xl"
          >
            <h3 className="text-[18px] font-bold text-ink mb-4">
              エラー
            </h3>
            <p className="text-[14px] text-ink-muted mb-8">
              パスワード変更に失敗しました。現在のパスワードを確認してください。
            </p>
            <button
              onClick={s.closePasswordResetError}
              className="w-full h-[48px] bg-primary rounded-md text-[16px] font-bold text-white hover:opacity-90 transition-colors"
            >
              確認
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {s.isPasswordResetOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          <header className="sticky top-0 z-10 bg-surface h-[52px] flex items-center px-4 gap-3 border-b border-line">
            <button aria-label="戻る" onClick={s.closePasswordReset} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">パスワード再設定</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink">パスワード</label>
                <input
                  type="password"
                  value={s.password}
                  onChange={(e) => s.setPassword(e.target.value)}
                  placeholder="パスワード入力"
                  className="w-full h-[48px] px-4 border border-line rounded-md bg-canvas text-[15px] focus:outline-none focus:border-black"
                />
                <p className="text-[13px] text-ink-muted">
                  パスワードが入力されていません。パスワードを入力するとメールでログインできます。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink">パスワード再入力</label>
                <input
                  type="password"
                  value={s.confirmPassword}
                  onChange={(e) => s.setConfirmPassword(e.target.value)}
                  placeholder="パスワード再入力"
                  className="w-full h-[48px] px-4 border border-line rounded-md bg-canvas text-[15px] focus:outline-none focus:border-black"
                />
              </div>

              <button
                onClick={s.handleSetPasswordForSocialUser}
                className="w-full h-[52px] bg-primary rounded-md text-[16px] font-bold text-white transition-colors"
              >
                パスワード再設定
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {s.isPasswordSetupPopupOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={s.closePasswordSetupPopup}
            className="absolute inset-0 bg-ink/50"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-surface rounded-xl w-full max-w-[320px] overflow-hidden shadow-2xl"
          >
            <div className="h-[150px] w-[320px] flex flex-col justify-center px-6 text-center">
              <h3 className="text-[15px] font-bold text-ink mb-6">
                パスワードを先に設定してください。
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={s.closePasswordSetupPopup}
                  className="flex-1 h-[44px] border border-line rounded-md text-[14px] font-bold text-ink hover:bg-canvas transition-colors"
                >
                  閉じる
                </button>
                <button
                  onClick={s.closePasswordSetupPopup}
                  className="flex-1 h-[44px] bg-primary rounded-md text-[14px] font-bold text-white hover:opacity-90 transition-colors"
                >
                  設定
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {s.isSimpleLoginSettingsOpen && (
        <SimpleLoginSettings
          onBack={s.closeSimpleLoginSettings}
        />
      )}
    </AnimatePresence>

    <InquiryPage
      isOpen={s.isInquiryOpen}
      onClose={s.closeInquiry}
      user={user}
      onOpenAccountManagement={() => { s.closeInquiry(); s.openAccountManagement(); }}
    />

    <CallerIdInfoSheet isOpen={isCallerIdSheetOpen} onClose={() => setIsCallerIdSheetOpen(false)} />
  </>
  );
};
