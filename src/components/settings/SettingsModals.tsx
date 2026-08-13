import React from 'react';
import {
  ArrowLeft, Megaphone, HelpCircle, Headset, Settings, UserCircle, ChevronRight,
  Image as ImageIcon, CreditCard, Phone, BarChart2, UserPlus, Briefcase, Users,
  BookOpen, ThumbsUp, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';
import SimpleLoginSettings from '../SimpleLoginSettings';
import type { AccountSettings } from '../../hooks/useAccountSettings';

interface SettingsModalsProps {
  settings: AccountSettings;
  user: FirebaseUser | null;
  onOpenProfileManagement: () => void;
}

export const SettingsModals: React.FC<SettingsModalsProps> = ({ settings: s, user, onOpenProfileManagement }) => (
  <>
    {/* More Page Overlay */}
    <AnimatePresence>
      {s.isMorePageOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-white z-[100] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[52px] flex items-center px-4 gap-3">
            <button onClick={s.closeMorePage} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">もっと見る</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Top Icons Grid */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-100">
              <button className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-[11px] font-bold text-gray-700">お知らせ</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-[11px] font-bold text-gray-700">ヘルプ</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <Headset className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-[11px] font-bold text-gray-700">1:1 お問い合わせ</span>
              </button>
              <button
                onClick={s.openSettingsPage}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-[11px] font-bold text-gray-700">設定</span>
              </button>
            </div>

            {/* My Info Section */}
            <div className="py-4">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">マイ情報</h3>
              </div>
              <button
                onClick={() => {
                  s.closeMorePage();
                  onOpenProfileManagement();
                }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">プロフィール管理</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Useful Features Section */}
            <div className="py-4">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">便利な機能</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">アルバムから名刺を取り込む</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">名刺を直接入力</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">着信時に相手の名刺情報を表示</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Business Services Section */}
            <div className="py-4">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">企業用サービス</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">会社員向けアンケート</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">会社員ターゲット広告</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">Rememberヘッドハンティングサービス</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">キャリア採用ソリューション</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">チーム名刺帳</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Other Section */}
            <div className="py-4 mb-8">
              <div className="px-4 py-2">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">その他</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">プロローグ</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-6 h-6 text-gray-700" />
                  <span className="text-[15px] font-bold text-gray-900">Rememberを推薦する</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
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
          className="fixed inset-0 bg-white z-[110] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[52px] flex items-center px-4 gap-3">
            <button onClick={s.closeSettingsPage} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">設定</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            {/* Account Section */}
            <div className="bg-white border-b border-gray-100">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">アカウント</h3>
              </div>
              <button
                onClick={s.openAccountManagement}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[15px] font-bold text-gray-900">アカウント管理</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={s.openPasswordFlow}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[15px] font-bold text-gray-900">パスワード再設定</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">簡易ログイン設定</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">携帯電話番号変更</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-gray-500">010-8526-8170</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>

            {/* Business Card Section */}
            <div className="bg-white border-b border-gray-100">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">名刺</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">着信時に相手の名刺情報を表示</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-gray-500">オフ</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">携帯電話の連絡先に保存</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">ファイルに書き出し</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">名刺撮影時にマイ名刺を送る</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* General Section */}
            <div className="bg-white border-b border-gray-100">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">一般</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">通知管理</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">画面テーマ</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-gray-500">システム設定モード</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>

            {/* Other Section */}
            <div className="bg-white border-b border-gray-100 mb-8">
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">その他</h3>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">法的通知</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">パスコードロック設定</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-gray-500">オフ</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-[15px] font-bold text-gray-900">サーバーと情報を再同期</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={s.handleLogout}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[15px] font-bold text-red-500">ログアウト</span>
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
          className="fixed inset-0 bg-white z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[52px] flex items-center px-4 gap-3">
            <button onClick={s.closeAccountManagement} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">アカウント</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="bg-white">
              <button
                onClick={s.openAccountChange}
                className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[16px] font-bold text-gray-900">アカウント変更</span>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-gray-500">{user?.email || 'milk454537@gmail.com'}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={s.openWithdrawal}
                className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[16px] font-bold text-gray-900">Rememberを退会</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
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
          className="fixed inset-0 bg-white z-[130] flex flex-col max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white h-[52px] flex items-center px-4">
            <button onClick={s.closeWithdrawal} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4">
            <div className="text-center mb-8">
              <h2 className="text-[24px] font-bold text-gray-900 mb-2">Rememberを退会</h2>
              <p className="text-[14px] text-gray-500">退会する前に以下の内容を必ずご確認ください</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 mb-8">
              <ul className="space-y-4 text-[13px] text-gray-600 leading-relaxed">
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
              <button
                onClick={s.toggleWithdrawalChecked}
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${s.isWithdrawalChecked ? 'bg-[#0A0A0A]/50 border-[#0A0A0A]' : 'border-gray-300 bg-white'}`}
              >
                <Check className={`w-4 h-4 ${s.isWithdrawalChecked ? 'text-white' : 'text-transparent'}`} />
              </button>
              <span className="text-[15px] font-bold text-gray-900">すべて削除して退会します</span>
            </div>

            <button
              disabled={!s.isWithdrawalChecked}
              onClick={s.handleWithdraw}
              className={`w-full py-4 rounded-lg text-[16px] font-bold transition-colors ${s.isWithdrawalChecked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}
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
          className="fixed inset-0 bg-white z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          <header className="sticky top-0 z-10 bg-white h-[52px] flex items-center px-4 gap-3 border-b border-gray-100">
            <button onClick={s.closePasswordChange} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">パスワード再設定</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-900">現在のパスワード *</label>
                <input
                  type="password"
                  value={s.currentPassword}
                  onChange={(e) => s.setCurrentPassword(e.target.value)}
                  placeholder="現在のパスワード入力"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-900">新しいパスワード *</label>
                <input
                  type="password"
                  value={s.password}
                  onChange={(e) => s.setPassword(e.target.value)}
                  placeholder="新しいパスワード入力"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                />
                <p className="text-[13px] text-gray-500">
                  英数字・記号のうち2種類以上を組み合わせて8文字以上で入力してください。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-900">新しいパスワード再入力 *</label>
                <input
                  type="password"
                  value={s.confirmPassword}
                  onChange={(e) => s.setConfirmPassword(e.target.value)}
                  placeholder="新しいパスワード再入力"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                />
              </div>

              <button
                onClick={s.handleChangePassword}
                className={`w-full h-[52px] rounded-md text-[16px] font-bold text-white transition-colors ${
                  !s.currentPassword || !s.password || !s.confirmPassword
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800'
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl w-full max-w-[320px] p-8 text-center shadow-2xl"
          >
            <h3 className="text-[18px] font-bold text-gray-900 mb-4">
              パスワードを変更しました
            </h3>
            <p className="text-[14px] text-gray-600 mb-8">
              既存にログインされた他の機器とブラウザでは再度ログインしてください。
            </p>
            <button
              onClick={s.closePasswordResetSuccess}
              className="w-full h-[48px] bg-black rounded-md text-[16px] font-bold text-white hover:bg-gray-800 transition-colors"
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl w-full max-w-[320px] p-8 text-center shadow-2xl"
          >
            <h3 className="text-[18px] font-bold text-gray-900 mb-4">
              エラー
            </h3>
            <p className="text-[14px] text-gray-600 mb-8">
              パスワード変更に失敗しました。現在のパスワードを確認してください。
            </p>
            <button
              onClick={s.closePasswordResetError}
              className="w-full h-[48px] bg-black rounded-md text-[16px] font-bold text-white hover:bg-gray-800 transition-colors"
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
          className="fixed inset-0 bg-white z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          <header className="sticky top-0 z-10 bg-white h-[52px] flex items-center px-4 gap-3 border-b border-gray-100">
            <button onClick={s.closePasswordReset} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">パスワード再設定</h1>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-900">パスワード</label>
                <input
                  type="password"
                  value={s.password}
                  onChange={(e) => s.setPassword(e.target.value)}
                  placeholder="パスワード入力"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                />
                <p className="text-[13px] text-gray-500">
                  パスワードが入力されていません。パスワードを入力するとメールでログインできます。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-900">パスワード再入力</label>
                <input
                  type="password"
                  value={s.confirmPassword}
                  onChange={(e) => s.setConfirmPassword(e.target.value)}
                  placeholder="パスワード再入力"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                />
              </div>

              <button
                onClick={s.handleSetPasswordForSocialUser}
                className="w-full h-[52px] bg-black rounded-md text-[16px] font-bold text-white transition-colors"
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
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-xl w-full max-w-[320px] overflow-hidden shadow-2xl"
          >
            <div className="h-[150px] w-[320px] flex flex-col justify-center px-6 text-center">
              <h3 className="text-[15px] font-bold text-gray-900 mb-6">
                パスワードを先に設定してください。
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={s.closePasswordSetupPopup}
                  className="flex-1 h-[44px] border border-gray-300 rounded-md text-[14px] font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
                <button
                  onClick={s.closePasswordSetupPopup}
                  className="flex-1 h-[44px] bg-black rounded-md text-[14px] font-bold text-white hover:bg-gray-800 transition-colors"
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
  </>
);
