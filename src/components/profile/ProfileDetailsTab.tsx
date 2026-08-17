import React from 'react';
import { User, Edit2, Briefcase, Clock, BarChart2, GraduationCap, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import type { Meishi, UserProfile } from '../../types/app';
import { AwardsSection } from './AwardsSection';
import { CertificatesSection } from './CertificatesSection';
import { PersonalInfoSection } from './PersonalInfoSection';
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

interface ProfileDetailsTabProps {
  userProfile: UserProfile | null;
  myMeishi: Meishi | undefined;
  completedProfileSteps: number[];
  onPickProfilePhoto: () => void;
  onOpenIntroEdit: () => void;
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

export const ProfileDetailsTab: React.FC<ProfileDetailsTabProps> = ({
  userProfile, myMeishi, completedProfileSteps, onPickProfilePhoto, onOpenIntroEdit,
  career, education, job, skill, language, website, lecture, publication, article,
  awards, certificates, personalInfo,
}) => (
  <div className="space-y-10">
    {/* Profile Completion Section */}
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-ink">プロフィールを完成させる</h3>
        <span className="text-xs text-ink-faint">残り{6 - completedProfileSteps.length}個</span>
      </div>
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= completedProfileSteps.length ? 'bg-primary' : 'bg-primary-soft'}`}></div>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-scrollbar">
        {/* Card 1 */}
        <div className="min-w-[160px] flex-1 bg-canvas rounded-lg p-4 flex flex-col items-center text-center snap-start">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3 shadow-sm">
            <User className="w-6 h-6 text-ink" />
          </div>
          <h4 className="font-bold text-sm mb-2 text-ink">プロフィール写真</h4>
          <p className="text-[10px] text-ink-muted mb-4 leading-relaxed flex-1">
            会員様を代表するプロフィール写真を追加してください
          </p>
          <button
            onClick={onPickProfilePhoto}
            className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(1) ? 'bg-primary-soft border-line text-ink-muted' : 'bg-surface border-line text-ink'}`}
          >
            {completedProfileSteps.includes(1) ? '完了' : '写真追加'}
          </button>
        </div>
        {/* Card 2 */}
        <div className="min-w-[160px] flex-1 bg-canvas rounded-lg p-4 flex flex-col items-center text-center snap-start">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3 shadow-sm">
            <Edit2 className="w-6 h-6 text-ink" />
          </div>
          <h4 className="font-bold text-sm mb-2 text-ink">自己紹介</h4>
          <p className="text-[10px] text-ink-muted mb-4 leading-relaxed flex-1">
            会員様を紹介する簡単な説明を入力してください
          </p>
          <button
            onClick={onOpenIntroEdit}
            className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(2) ? 'bg-primary-soft border-line text-ink-muted' : 'bg-surface border-line text-ink'}`}
          >
            {completedProfileSteps.includes(2) ? '完了' : '紹介入力'}
          </button>
        </div>
        {/* Card 3 */}
        <div className="min-w-[160px] flex-1 bg-canvas rounded-lg p-4 flex flex-col items-center text-center snap-start">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3 shadow-sm">
            <Briefcase className="w-6 h-6 text-ink" />
          </div>
          <h4 className="font-bold text-sm mb-2 text-ink">経歴情報</h4>
          <p className="text-[10px] text-ink-muted mb-4 leading-relaxed flex-1">
            代表的な経歴を入力してください
          </p>
          <button
            onClick={() => career.openList()}
            className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(3) ? 'bg-primary-soft border-line text-ink-muted' : 'bg-surface border-line text-ink'}`}
          >
            {completedProfileSteps.includes(3) ? '完了' : '経歴入力'}
          </button>
        </div>
        {/* Card 4 */}
        <div className="min-w-[160px] flex-1 bg-canvas rounded-lg p-4 flex flex-col items-center text-center snap-start">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3 shadow-sm">
            <Clock className="w-6 h-6 text-ink" />
          </div>
          <h4 className="font-bold text-sm mb-2 text-ink">総経歴年数</h4>
          <p className="text-[10px] text-ink-muted mb-4 leading-relaxed flex-1">
            総経歴年数を教えてください
          </p>
          <button
            onClick={() => career.openList()}
            className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(4) ? 'bg-primary-soft border-line text-ink-muted' : 'bg-surface border-line text-ink'}`}
          >
            {completedProfileSteps.includes(4) ? '完了' : '年数入力'}
          </button>
        </div>
        {/* Card 5 */}
        <div className="min-w-[160px] flex-1 bg-canvas rounded-lg p-4 flex flex-col items-center text-center snap-start">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3 shadow-sm">
            <BarChart2 className="w-6 h-6 text-ink" />
          </div>
          <h4 className="font-bold text-sm mb-2 text-ink">スキル</h4>
          <p className="text-[10px] text-ink-muted mb-4 leading-relaxed flex-1">
            職務スキルを教えてください
          </p>
          <button
            onClick={() => skill.open()}
            className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(5) ? 'bg-primary-soft border-line text-ink-muted' : 'bg-surface border-line text-ink'}`}
          >
            {completedProfileSteps.includes(5) ? '完了' : 'スキル追加'}
          </button>
        </div>
        {/* Card 6 */}
        <div className="min-w-[160px] flex-1 bg-canvas rounded-lg p-4 flex flex-col items-center text-center snap-start">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3 shadow-sm">
            <GraduationCap className="w-6 h-6 text-ink" />
          </div>
          <h4 className="font-bold text-sm mb-2 text-ink">学歴</h4>
          <p className="text-[10px] text-ink-muted mb-4 leading-relaxed flex-1">
            最終学歴を教えてください
          </p>
          <button
            onClick={() => education.open()}
            className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(6) ? 'bg-primary-soft border-line text-ink-muted' : 'bg-surface border-line text-ink'}`}
          >
            {completedProfileSteps.includes(6) ? '完了' : '学歴入力'}
          </button>
        </div>
      </div>
    </div>

    {/* Dashed Sections */}
    <div className="space-y-6">
      {[
        { title: '紹介', action: '+ 紹介追加', onClick: onOpenIntroEdit },
        { title: '経歴', action: '+ 経歴追加', onClick: () => career.openList() },
        { title: '学歴', action: '+ 学歴追加', onClick: () => education.open() },
        { title: '職務', action: '+ 職務追加', onClick: () => job.open() },
        { title: '専門分野・スキル', action: '+ 専門分野・スキル追加', onClick: () => skill.open() },
        { title: '外国語', action: '+ 外国語追加', onClick: () => language.openNew() },
        { title: 'ウェブサイト・ブログ', action: '+ ウェブサイト・ブログ追加', onClick: () => website.open() },
        { title: '講義・諮問活動', action: '+ 講義・諮問活動追加', onClick: () => lecture.open() },
        { title: '論文・著書', action: '+ 論文・著書追加', onClick: () => publication.open() },
        { title: '記事', action: '+ 記事追加', onClick: () => article.openNew() },
      ].map((section, idx) => {
        const hasData =
          (section.title === '紹介' && !!userProfile?.introduction) ||
          (section.title === '経歴' && (!!(userProfile?.careers && userProfile.careers.length > 0) || !!userProfile?.totalCareerYears)) ||
          (section.title === '学歴' && !!(userProfile?.educations && userProfile.educations.length > 0)) ||
          (section.title === '職務' && !!(userProfile?.jobs && userProfile.jobs.length > 0)) ||
          (section.title === '専門分野・スキル' && !!(userProfile?.skills && userProfile.skills.length > 0)) ||
          (section.title === '外国語' && !!(userProfile?.languages && userProfile.languages.length > 0)) ||
          (section.title === 'ウェブサイト・ブログ' && !!(userProfile?.websites && userProfile.websites.length > 0)) ||
          (section.title === '講義・諮問活動' && !!(userProfile?.lectures && userProfile.lectures.length > 0)) ||
          (section.title === '論文・著書' && !!(userProfile?.publications && userProfile.publications.length > 0)) ||
          (section.title === '記事' && !!(userProfile?.articles && userProfile.articles.length > 0));

        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink">{section.title}</h3>
              {hasData && (
                <button
                  onClick={section.title === '記事' ? article.openList : section.onClick}
                  className="text-ink-muted text-sm flex items-center gap-1"
                >
                  編集 <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {section.title === '紹介' && userProfile?.introduction ? (
              <div className="bg-canvas rounded-lg p-4 relative group">
                <p className="text-sm text-ink-muted whitespace-pre-wrap">{userProfile.introduction}</p>
              </div>
            ) : section.title === '経歴' && (!!(userProfile?.careers && userProfile.careers.length > 0) || !!userProfile?.totalCareerYears) ? (
              <div className="space-y-3">
                {userProfile?.totalCareerYears && (
                  <div className="mb-2">
                    <span className="text-ink-muted text-sm">総経歴年数 </span>
                    <span className="text-primary font-bold">{userProfile.totalCareerYears}年</span>
                  </div>
                )}
                {userProfile?.careers && userProfile.careers.map((careerItem) => (
                  <div key={careerItem.id} className="bg-canvas rounded-lg p-4 relative group">
                    <h4 className="font-bold text-ink">{careerItem.companyName}</h4>
                    {(careerItem.title || careerItem.department) && (
                      <p className="text-sm text-ink-muted mt-1">
                        {careerItem.department} {careerItem.title}
                      </p>
                    )}
                    <p className="text-sm text-ink-muted mt-1">
                      {careerItem.startDate.replace('-', '.')} ~ {careerItem.isCurrent ? '在職中' : careerItem.endDate?.replace('-', '.')}
                    </p>
                    {careerItem.description && (
                      <p className="text-sm text-ink-muted mt-2 whitespace-pre-wrap">
                        {careerItem.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : section.title === '学歴' && userProfile?.educations && userProfile.educations.length > 0 ? (
              <div className="space-y-3">
                {userProfile.educations.map((edu) => (
                  <div key={edu.id} className="bg-canvas rounded-lg p-4 relative group">
                    <h4 className="font-bold text-ink">{edu.schoolName}</h4>
                    <p className="text-sm text-ink-muted mt-1">
                      {edu.major} {edu.degree ? `(${edu.degree})` : ''}
                    </p>
                    <p className="text-sm text-ink-muted mt-1">
                      {edu.startDate ? `${edu.startDate}年` : ''} ~ {edu.isCurrent ? '在学中' : (edu.endDate ? `${edu.endDate}年` : '')}
                    </p>
                    {edu.description && (
                      <p className="text-sm text-ink-muted mt-2 whitespace-pre-wrap">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : section.title === '職務' && userProfile?.jobs && userProfile.jobs.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {userProfile.jobs.map((jobItem, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-soft text-ink-muted rounded-full text-sm font-medium">
                      {jobItem}
                    </span>
                  ))}
                </div>
              </div>
            ) : section.title === '専門分野・スキル' && userProfile?.skills && userProfile.skills.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((skillItem, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-soft text-ink-muted rounded-full text-sm font-medium">
                      {skillItem}
                    </span>
                  ))}
                </div>
              </div>
            ) : section.title === '外国語' && userProfile?.languages && userProfile.languages.length > 0 ? (
              <div className="space-y-3">
                {userProfile.languages.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-surface">
                    <div>
                      <div className="font-bold text-ink">{lang.language}</div>
                      <div className="text-sm text-ink-muted mt-1">{lang.level}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => language.openExisting(lang)}
                        className="tap-44 p-2.5 -m-0.5 text-ink-faint hover:text-ink-muted transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => language.deleteLanguage(lang.id)}
                        className="tap-44 p-2.5 -m-0.5 text-ink-faint hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : section.title === 'ウェブサイト・ブログ' && userProfile?.websites && userProfile.websites.length > 0 ? (
              <div className="space-y-3">
                {userProfile.websites.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-line rounded-lg bg-surface">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate mr-4">
                      {url}
                    </a>
                    <button aria-label="編集"
                      onClick={website.open}
                      className="tap-44 p-2.5 -m-0.5 text-ink-faint hover:text-ink-muted transition-colors shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : section.title === '講義・諮問活動' && userProfile?.lectures && userProfile.lectures.length > 0 ? (
              <div className="space-y-3">
                {userProfile.lectures.map((lectureItem) => (
                  <div key={lectureItem.id} className="bg-canvas rounded-lg p-4 relative group">
                    <h4 className="font-bold text-ink">{lectureItem.title}</h4>
                    <p className="text-sm text-ink-muted mt-1">
                      {lectureItem.date.replace('-', '年 ')}月
                    </p>
                  </div>
                ))}
              </div>
            ) : section.title === '論文・著書' && userProfile?.publications && userProfile.publications.length > 0 ? (
              <div className="space-y-3">
                {userProfile.publications.map((publicationItem) => (
                  <div key={publicationItem.id} className="bg-canvas rounded-lg p-4 relative group">
                    <h4 className="font-bold text-ink">{publicationItem.title}</h4>
                    <p className="text-sm text-ink-muted mt-1">
                      {publicationItem.date.replace('-', '年 ')}月
                    </p>
                  </div>
                ))}
              </div>
            ) : section.title === '記事' && userProfile?.articles && userProfile.articles.length > 0 ? (
              <div className="space-y-4">
                {userProfile.articles.map((articleItem) => (
                  <div key={articleItem.id} className="relative group">
                    <div className="flex items-start">
                      <span className="text-ink-muted mr-2">•</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-ink">{articleItem.title}</h4>
                        <a href={articleItem.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block truncate">
                          {articleItem.url}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={section.onClick}
                className="w-full border border-dashed border-line rounded-lg py-4 text-ink-faint text-sm font-medium flex items-center justify-center hover:bg-canvas transition-colors"
              >
                {section.action}
              </button>
            )}
          </div>
        );
      })}
    </div>

    <PersonalInfoSection userProfile={userProfile} personalInfo={personalInfo} />

    <AwardsSection userProfile={userProfile} awards={awards} />

    <CertificatesSection userProfile={userProfile} certificates={certificates} />

    {/* Preferred Conditions */}
    <div className="pt-4 border-t border-line">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-ink">希望する提案条件設定</h3>
          <p className="text-xs text-ink-faint mt-1 flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border border-ink-faint flex items-center justify-center text-[8px]">i</span>
            採用担当者とヘッドハンターにのみ公開されます
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-ink-faint" />
      </div>
    </div>

    {/* Contact Info Section */}
    <section className="pt-8 border-t border-line">
      <h3 className="font-bold text-ink mb-6 flex items-center justify-between">
        <span>連絡先</span>
        {myMeishi && <Edit3 className="w-4 h-4 text-ink-faint cursor-pointer" />}
      </h3>
      <div className="space-y-4">
        <div className="flex items-start">
          <span className="w-24 text-sm text-ink-muted">携帯電話</span>
          <span className="text-sm text-ink font-medium">{myMeishi?.mobile || 'なし'}</span>
        </div>
        <div className="flex items-start">
          <span className="w-24 text-sm text-ink-muted">固定電話</span>
          <span className="text-sm text-ink font-medium">{myMeishi?.phone || 'なし'}</span>
        </div>
        <div className="flex items-start">
          <span className="w-24 text-sm text-ink-muted">メール</span>
          <span className="text-sm text-ink font-medium">{myMeishi?.email || 'なし'}</span>
        </div>
        <div className="flex items-start">
          <span className="w-24 text-sm text-ink-muted">ファックス</span>
          <span className="text-sm text-ink font-medium">{myMeishi?.fax || 'なし'}</span>
        </div>
      </div>
    </section>

    {/* Birthday Section */}
    <section className="pb-10 pt-8 border-t border-line">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-ink">誕生日</h3>
        <button onClick={personalInfo.open} className="text-sm text-ink-faint hover:text-ink-muted">編集</button>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-line rounded-full"></div>
        <span className="text-sm text-ink font-medium">{userProfile?.birthday || '未設定'}</span>
      </div>
    </section>
  </div>
);
