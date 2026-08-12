import React from 'react';
import { Plus, Share2, MapPin, Trash2 } from 'lucide-react';
import type { Meishi, UserProfile } from '../../types/app';

interface MyMeishiTabProps {
  myMeishi: Meishi | undefined;
  userProfile: UserProfile | null;
  onOpenCamera: () => void;
  onDeleteMyMeishi: () => void;
}

export const MyMeishiTab: React.FC<MyMeishiTabProps> = ({ myMeishi, userProfile, onOpenCamera, onDeleteMyMeishi }) => (
  <div className="space-y-6">
    {/* Business Card Registration Box */}
    {!myMeishi ? (
      <div
        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group"
        onClick={onOpenCamera}
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
          <Plus className="w-6 h-6 text-gray-900" />
        </div>
        <p className="text-sm text-gray-500 font-medium text-center">
          在職中の会社の名刺を登録してください
        </p>
      </div>
    ) : (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] text-gray-400">
            名刺 最終アップデート {new Date(myMeishi.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
          </span>
          <button
            onClick={onOpenCamera}
            className="text-xs font-bold text-gray-900 underline underline-offset-4"
          >
            名刺 交換
          </button>
        </div>

        <div className="aspect-[1.6/1] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white mb-6 p-1">
          <div className="w-full h-full rounded-lg overflow-hidden">
            <img src={myMeishi.imageUrl} alt="Business Card" className="w-full h-full object-contain" />
          </div>
        </div>

        <button className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform mb-10">
          <Share2 className="w-4 h-4" />
          <span>マイ名刺を共有する</span>
        </button>

        {/* 名刺情報 (Business Card Information) */}
        <div className="pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">名刺情報</h3>
            <button className="text-sm text-gray-400 font-medium">編集</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">会社</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.company}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">部署</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.department || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">役職</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.position}</span>
            </div>
          </div>
        </div>

        {/* 連絡先 (Contact Information) */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">連絡先</h3>
            <button className="text-sm text-gray-400 font-medium">編集</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">携帯電話</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.mobile || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">電話番号</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.phone || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">メールアドレス</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.email}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">FAX</span>
              <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.fax || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-gray-500 text-sm">住所</span>
              <span className="flex-1 text-gray-900 text-sm font-medium leading-relaxed">
                {myMeishi.address} {myMeishi.detailedAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-8 rounded-xl overflow-hidden h-48 bg-gray-100 relative">
          <img
            src="https://picsum.photos/seed/map/600/400"
            alt="Map"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0A0A0A]" />
              <span className="text-xs font-bold text-gray-900">地図を見る</span>
            </div>
          </div>
        </div>

        {/* Business Card History */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold text-gray-900">名刺ヒストリー</h3>
            <button className="text-sm text-gray-500">編集</button>
          </div>
          {myMeishi.history && myMeishi.history.length > 0 ? (
            <div className="relative space-y-12 pl-4">
              {/* Timeline Line */}
              <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-gray-200"></div>

              {myMeishi.history.map((h, idx) => (
                <div key={idx} className="relative flex items-start justify-between gap-4">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[14px] top-1.5 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white z-10"></div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 mb-1">{h.company}</p>
                    <p className="text-sm text-gray-800 mb-1">{h.position}</p>
                    <p className="text-sm text-gray-400">{h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '年 ').replace(/\//g, '月 ') + '日' : '2025年 09月 02日'}</p>
                  </div>

                  <div className="w-24 h-16 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src={h.imageUrl || "https://picsum.photos/seed/card/200/120"}
                      alt="Card Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-gray-200"></div>
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[14px] top-1.5 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white z-10"></div>
                <p className="text-sm text-gray-400">履歴がありません</p>
              </div>
            </div>
          )}
        </div>

        {/* Birthday */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold text-gray-900">誕生日</h3>
            <button className="text-sm text-gray-500">編集</button>
          </div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <span className="text-sm text-gray-900">
              {userProfile?.birthday || '10月 20日'} (陽暦)
            </span>
          </div>
        </div>

        {/* Delete My Card */}
        <div className="mt-10 pt-8 border-t border-gray-100 pb-10">
          <button
            onClick={onDeleteMyMeishi}
            className="w-full py-4 rounded-xl border border-red-100 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>自分の名刺を削除</span>
          </button>
        </div>
      </div>
    )}
  </div>
);
