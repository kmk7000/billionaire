import React, { useState } from 'react';
import { Plus, Share2, MapPin, Trash2, ChevronRight, IdCard } from 'lucide-react';
import type { Meishi, UserProfile } from '../../types/app';

interface MyMeishiTabProps {
  myMeishi: Meishi | undefined;
  userProfile: UserProfile | null;
  onOpenCamera: () => void;
  onDeleteMyMeishi: () => void;
  onOpenPublicCard: () => void;
  publicHandle: string | null;
  /** Opens the card editor — it covers both 名刺情報 and 連絡先 fields. */
  onEditMeishi: () => void;
  /** 誕生日 lives on the user profile, not the card, so it opens 個人情報. */
  onEditBirthday: () => void;
  onOpenMap: () => void;
  /** Past マイ名刺, newest first. */
  history: Meishi[];
  onDeleteHistoryEntry: (id: string) => void;
}

export const MyMeishiTab: React.FC<MyMeishiTabProps> = ({ myMeishi, userProfile, onOpenCamera, onDeleteMyMeishi, onOpenPublicCard, publicHandle, onEditMeishi, onEditBirthday, onOpenMap, history, onDeleteHistoryEntry }) => {
  const [isHistoryEditing, setIsHistoryEditing] = useState(false);

  return (
  <div className="space-y-6">
    {/* Business Card Registration Box */}
    {!myMeishi ? (
      <div
        className="border-2 border-dashed border-line rounded-2xl p-12 flex flex-col items-center justify-center bg-canvas cursor-pointer hover:bg-primary-soft transition-colors group"
        onClick={onOpenCamera}
      >
        <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-4 shadow-sm border border-line group-hover:scale-110 transition-transform">
          <Plus className="w-6 h-6 text-ink" />
        </div>
        <p className="text-sm text-ink-muted font-medium text-center">
          在職中の会社の名刺を登録してください
        </p>
      </div>
    ) : (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] text-ink-faint">
            名刺 最終アップデート {new Date(myMeishi.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
          </span>
          <button
            onClick={onOpenCamera}
            className="text-xs font-bold text-ink underline underline-offset-4"
          >
            名刺 交換
          </button>
        </div>

        <div className="aspect-[1.6/1] w-full rounded-xl overflow-hidden border border-line shadow-sm bg-surface mb-6 p-1">
          <div className="w-full h-full rounded-lg overflow-hidden">
            <img src={myMeishi.imageUrl} alt="Business Card" className="w-full h-full object-contain" />
          </div>
        </div>

        <button
          onClick={onOpenPublicCard}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform mb-2"
        >
          <Share2 className="w-4 h-4" />
          <span>マイ名刺を共有する</span>
        </button>
        <p className="text-[11px] text-ink-faint text-center mb-10">
          {publicHandle ? `公開URL: @${publicHandle}` : '公開IDを設定すると、URLひとつで名刺を渡せます'}
        </p>

        {/* 名刺情報 (Business Card Information) */}
        <div className="pt-8 border-t border-line">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-ink">名刺情報</h3>
            <button onClick={onEditMeishi} className="text-sm text-ink-faint font-medium">編集</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">会社</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.company}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">部署</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.department || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">役職</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.position}</span>
            </div>
          </div>
        </div>

        {/* 連絡先 (Contact Information) */}
        <div className="mt-10 pt-8 border-t border-line">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-ink">連絡先</h3>
            <button onClick={onEditMeishi} className="text-sm text-ink-faint font-medium">編集</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">携帯電話</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.mobile || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">電話番号</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.phone || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">メールアドレス</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.email}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">FAX</span>
              <span className="flex-1 text-ink text-sm font-medium">{myMeishi.fax || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-ink-muted text-sm">住所</span>
              <span className="flex-1 text-ink text-sm font-medium leading-relaxed">
                {myMeishi.address} {myMeishi.detailedAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Opens the real card map. This used to be a random stock photo from
            picsum.photos dressed up as a map, which showed a different picture
            on every load and had nothing to do with the address above it. */}
        <button
          onClick={onOpenMap}
          className="mt-8 w-full rounded-xl border border-line bg-canvas px-4 py-4 flex items-center gap-3 hover:bg-primary-soft transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-ink" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-ink">地図を見る</span>
            <span className="block text-xs text-ink-muted truncate">
              {myMeishi.address ? `${myMeishi.address} ${myMeishi.detailedAddress || ''}`.trim() : '住所が未登録です'}
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-ink-faint shrink-0" />
        </button>

        {/* 名刺ヒストリー — previous マイ名刺, archived when a new one is
            registered. Entries are real cards (isPastMyCard), not embedded
            copies, so their images stay out of the current card's document. */}
        <div className="mt-10 pt-8 border-t border-line">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold text-ink">名刺ヒストリー</h3>
            {history.length > 0 && (
              <button
                onClick={() => setIsHistoryEditing((editing) => !editing)}
                className="text-sm text-ink-muted"
              >
                {isHistoryEditing ? '完了' : '編集'}
              </button>
            )}
          </div>
          {history.length > 0 ? (
            <div className="relative space-y-12 pl-4">
              {/* Timeline Line */}
              <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-line"></div>

              {history.map((entry) => (
                <div key={entry.id} className="relative flex items-start justify-between gap-4">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[14px] top-1.5 w-3.5 h-3.5 rounded-full bg-line border-2 border-surface z-10"></div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink mb-1">{entry.company}</p>
                    <p className="text-sm text-ink mb-1">{entry.position}</p>
                    <p className="text-sm text-ink-faint">
                      {entry.archivedAt
                        ? `${new Date(entry.archivedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')} まで`
                        : ''}
                    </p>
                    {isHistoryEditing && (
                      <button
                        onClick={() => onDeleteHistoryEntry(entry.id)}
                        className="mt-2 text-xs font-bold text-danger"
                      >
                        この履歴を削除
                      </button>
                    )}
                  </div>

                  <div className="w-24 h-16 rounded border border-line overflow-hidden flex-shrink-0 bg-canvas">
                    {entry.imageUrl ? (
                      <img src={entry.imageUrl} alt={`${entry.company}の名刺`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center">
                        <IdCard className="w-5 h-5 text-ink-faint" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-line"></div>
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[14px] top-1.5 w-3.5 h-3.5 rounded-full bg-line border-2 border-surface z-10"></div>
                <p className="text-sm text-ink-faint">
                  履歴がありません。新しい名刺を登録すると、今の名刺がここに残ります。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Birthday */}
        <div className="mt-10 pt-8 border-t border-line">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold text-ink">誕生日</h3>
            <button onClick={onEditBirthday} className="text-sm text-ink-muted">編集</button>
          </div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <span className="text-sm text-ink">
              {userProfile?.birthday || '10月 20日'} (陽暦)
            </span>
          </div>
        </div>

        {/* Delete My Card */}
        <div className="mt-10 pt-8 border-t border-line pb-10">
          <button
            onClick={onDeleteMyMeishi}
            className="w-full py-4 rounded-xl border border-danger/20 text-danger font-bold flex items-center justify-center gap-2 hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>自分の名刺を削除</span>
          </button>
        </div>
      </div>
    )}
  </div>
);
};
