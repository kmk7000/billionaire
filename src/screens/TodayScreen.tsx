import React from 'react';
import { User, ChevronRight, FileText, Briefcase, Clock, BarChart2, GraduationCap, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';

interface TodayScreenProps {
  user: FirebaseUser;
  completedProfileSteps: number[];
  toggleProfileStep: (step: number) => void;
  onOpenProfile: () => void;
  onOpenIntroEdit: () => void;
  onOpenCareerList: () => void;
  onOpenEducationEdit: () => void;
  onOpenMyMeishiCamera: () => void;
  onOpenMeishiCamera: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  user,
  completedProfileSteps,
  toggleProfileStep,
  onOpenProfile,
  onOpenIntroEdit,
  onOpenCareerList,
  onOpenEducationEdit,
  onOpenMyMeishiCamera,
  onOpenMeishiCamera,
}) => (
  <motion.div
    key="today"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-white min-h-screen pb-24"
  >
    <div className="p-4">
      {/* User Profile */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-base font-bold text-gray-900">{user.displayName || 'ゲストユーザー'}</h2>
        </div>
        <button
          onClick={onOpenProfile}
          className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700"
        >
          マイプロフィール
        </button>
      </div>

      {/* Profile Completion */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-xs">プロフィールを完成させる <span className="text-gray-400 font-normal">({completedProfileSteps.length}/6)</span></h3>
          <button className="flex items-center text-gray-400 text-xs gap-1">
            折りたたむ <ChevronRight className="w-3 h-3 -rotate-90" />
          </button>
        </div>

        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= completedProfileSteps.length ? 'bg-black' : 'bg-gray-100'}`}></div>
          ))}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-scrollbar">
          {/* Card 1 */}
          <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-700" />
              <h4 className="font-bold text-gray-900 text-xs">プロフィール写真</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
              あなたを代表するプロフィール写真を追加してください
            </p>
            <button
              onClick={() => toggleProfileStep(1)}
              className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(1) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
            >
              {completedProfileSteps.includes(1) ? '完了' : '写真を追加'}
            </button>
          </div>

          {/* Card 2 */}
          <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-700" />
              <h4 className="font-bold text-gray-900 text-xs">自己紹介</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
              あなたを紹介する簡単な説明を入力してください
            </p>
            <button
              onClick={onOpenIntroEdit}
              className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(2) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
            >
              {completedProfileSteps.includes(2) ? '完了' : '紹介を入力'}
            </button>
          </div>

          {/* Card 3 */}
          <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-gray-700" />
              <h4 className="font-bold text-gray-900 text-xs">経歴情報</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
              代表的な経歴を入力してください
            </p>
            <button
              onClick={onOpenCareerList}
              className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(3) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
            >
              {completedProfileSteps.includes(3) ? '完了' : '経歴を入力'}
            </button>
          </div>

          {/* Card 4 */}
          <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-700" />
              <h4 className="font-bold text-gray-900 text-xs">総経歴年数</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
              総経歴年数を教えてください
            </p>
            <button
              onClick={() => toggleProfileStep(4)}
              className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(4) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
            >
              {completedProfileSteps.includes(4) ? '完了' : '経歴年数を入力'}
            </button>
          </div>

          {/* Card 5 */}
          <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-gray-700" />
              <h4 className="font-bold text-gray-900 text-xs">スキル</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
              職務スキルを教えてください
            </p>
            <button
              onClick={() => toggleProfileStep(5)}
              className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(5) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
            >
              {completedProfileSteps.includes(5) ? '完了' : 'スキルを追加'}
            </button>
          </div>

          {/* Card 6 */}
          <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-gray-700" />
              <h4 className="font-bold text-gray-900 text-xs">学歴</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
              最終学歴を教えてください
            </p>
            <button
              onClick={onOpenEducationEdit}
              className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(6) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
            >
              {completedProfileSteps.includes(6) ? '完了' : '学歴を入力'}
            </button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div>
        <h3 className="font-bold text-base text-gray-900 mb-4">新規会員のためのTIP</h3>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded mb-2">発信者表示</span>
            <p className="font-bold text-gray-900 text-xs leading-relaxed">
              名刺を連絡先に保存する必要はありません。電話がかかってくるとRememberがお知らせします。
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <span className="inline-block px-2 py-0.5 bg-[#0A0A0A]/5 text-[#0A0A0A] text-[10px] font-bold rounded mb-2">スカウト提案</span>
            <p className="font-bold text-gray-900 text-xs leading-relaxed">
              良いスカウト提案をたくさん受けるには、このようにプロフィールを作成してみてください。
            </p>
          </div>

          <div
            className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={onOpenMyMeishiCamera}
          >
            <span className="inline-block px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded mb-2">自分の名刺登録</span>
            <p className="font-bold text-gray-900 text-xs leading-relaxed">
              自分の名刺を登録すると良い2つの利点をお知...
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Action Button */}
    <button
      onClick={onOpenMeishiCamera}
      className="fixed bottom-20 right-4 bg-[#0A0A0A] hover:bg-black text-white px-5 py-3 rounded-full font-bold shadow-lg flex items-center gap-1 z-30"
    >
      <Plus className="w-5 h-5" />
      名刺登録
    </button>
  </motion.div>
);
