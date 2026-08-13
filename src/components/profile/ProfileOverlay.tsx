import React from 'react';
import { ArrowLeft, UserCog, Edit2, Plus, User, Camera, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Meishi, UserProfile } from '../../types/app';
import { MyMeishiTab } from './MyMeishiTab';
import { ProfileDetailsTab } from './ProfileDetailsTab';
import type { CareerEditor } from '../../hooks/useCareerEditor';
import type { EducationEditor } from '../../hooks/useEducationEditor';
import type { JobEditor } from '../../hooks/useJobEditor';
import type { SkillEditor } from '../../hooks/useSkillEditor';
import type { LanguageEditor } from '../../hooks/useLanguageEditor';
import type { WebsiteEditor } from '../../hooks/useWebsiteEditor';
import type { LectureEditor } from '../../hooks/useLectureEditor';
import type { PublicationEditor } from '../../hooks/usePublicationEditor';
import type { ArticleEditor } from '../../hooks/useArticleEditor';
import type { AwardsEditor } from '../../hooks/useAwardsEditor';
import type { CertificatesEditor } from '../../hooks/useCertificatesEditor';
import type { PersonalInfoEditor } from '../../hooks/usePersonalInfoEditor';

const PROFILE_TABS = ['マイ名刺', 'プロフィール', '履歴書管理', 'お知らせ', '投稿'];

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  myMeishi: Meishi | undefined;
  profileTab: number;
  onChangeProfileTab: (tab: number) => void;
  completedProfileSteps: number[];
  toggleProfileStep: (step: number) => void;
  onOpenIntroEdit: () => void;
  onOpenCamera: () => void;
  onDeleteMyMeishi: () => void;
  career: CareerEditor;
  education: EducationEditor;
  job: JobEditor;
  skill: SkillEditor;
  language: LanguageEditor;
  website: WebsiteEditor;
  lecture: LectureEditor;
  publication: PublicationEditor;
  article: ArticleEditor;
  awards: AwardsEditor;
  certificates: CertificatesEditor;
  personalInfo: PersonalInfoEditor;
}

export const ProfileOverlay: React.FC<ProfileOverlayProps> = ({
  isOpen, onClose, user, userProfile, myMeishi, profileTab, onChangeProfileTab,
  completedProfileSteps, toggleProfileStep, onOpenIntroEdit, onOpenCamera, onDeleteMyMeishi,
  career, education, job, skill, language, website, lecture, publication, article,
  awards, certificates, personalInfo,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-white z-50 overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
      >
        {/* Profile Page Content */}
        <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{user?.displayName || 'ユーザー'}</h1>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <UserCog className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        <div className="px-4 pb-8">
          {/* Dark Card */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#333333] rounded-2xl p-6 text-white relative overflow-hidden mb-6 shadow-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold tracking-tight">{user?.displayName || 'ユーザー名'}</h2>
              <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors" />
            </div>
            <button
              onClick={onOpenIntroEdit}
              className="text-gray-400 text-sm flex items-center gap-1 mb-4 hover:text-white transition-colors group"
            >
              コネクトひとこと紹介を追加 <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
            </button>

            {myMeishi && (
              <div className="mb-6 space-y-0.5">
                <p className="text-lg font-bold text-white">{myMeishi.company}</p>
                <p className="text-sm text-gray-300">{myMeishi.position}</p>
                <p className="text-sm text-gray-400">{myMeishi.department}</p>
              </div>
            )}

            <div className="text-sm text-gray-400 font-medium">
              フォロワー <span className="font-bold text-white">128</span> <span className="mx-2 text-gray-600">|</span> フォロー中 <span className="font-bold text-white">129</span>
            </div>

            {/* Profile Avatar */}
            <div className="absolute bottom-6 right-6">
              <div className="relative">
                <div className="w-20 h-20 bg-[#e5e5e5] rounded-full border-4 border-[#1a1a1a] flex items-center justify-center overflow-hidden shadow-inner">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#262626] rounded-full flex items-center justify-center border-2 border-[#1a1a1a] shadow-lg hover:bg-[#333333] transition-colors">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-between bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
            {[
              { label: '届いた提案', value: '0' },
              { label: '新着メッセージ', value: '0' },
              { label: '応募状況', value: '0' },
              { label: '週間閲覧数', value: '0' },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 border-r last:border-r-0 border-gray-200 px-1">
                <span className="font-bold text-lg text-gray-900 leading-none">{stat.value}</span>
                <span className="text-[10px] text-gray-500 mt-2 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Notification Banner */}
          <div className="bg-[#0A0A0A]/5 rounded-xl p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0A0A0A]/10 rounded-full flex items-center justify-center relative">
                <Mail className="w-5 h-5 text-[#0A0A0A]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{user?.displayName || 'ユーザー'}様、</p>
                <p className="text-sm font-bold text-gray-900">新しい提案が届きました！</p>
              </div>
            </div>
            <button className="bg-black text-white text-xs font-bold px-4 py-2 rounded relative">
              確認する
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#0A0A0A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
            {PROFILE_TABS.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => onChangeProfileTab(idx)}
                className={`px-4 py-3 text-[12px] font-bold whitespace-nowrap transition-colors ${profileTab === idx ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {profileTab === 0 ? (
            /* My Business Card Tab */
            <MyMeishiTab
              myMeishi={myMeishi}
              userProfile={userProfile}
              onOpenCamera={onOpenCamera}
              onDeleteMyMeishi={onDeleteMyMeishi}
            />
          ) : profileTab === 1 ? (
            /* Profile Tab (Existing Content) */
            <ProfileDetailsTab
              userProfile={userProfile}
              myMeishi={myMeishi}
              completedProfileSteps={completedProfileSteps}
              toggleProfileStep={toggleProfileStep}
              onOpenIntroEdit={onOpenIntroEdit}
              career={career}
              education={education}
              job={job}
              skill={skill}
              language={language}
              website={website}
              lecture={lecture}
              publication={publication}
              article={article}
              awards={awards}
              certificates={certificates}
              personalInfo={personalInfo}
            />
          ) : (
            /* Other Tabs Placeholder */
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm">準備中です</p>
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
