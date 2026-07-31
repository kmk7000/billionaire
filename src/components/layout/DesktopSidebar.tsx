import React from 'react';
import { MessageSquare } from 'lucide-react';

export const DesktopSidebar: React.FC<{ onNavigateCommunity: () => void }> = ({ onNavigateCommunity }) => (
  <aside className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-22">
    {/* Real-time Trending Posts Widget (リアルタイム人気記事 Top 5) */}
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-bold text-sm text-gray-900">リアルタイム人気記事 Top 5</h3>
        </div>
        <span className="text-[10px] text-gray-400">Remember Live</span>
      </div>

      <div className="space-y-3">
        {[
          { rank: 1, title: 'LINEヤフー vs メルカリ 年収交渉・転職ノウハウ', comments: 42, board: 'IT・企画' },
          { rank: 2, title: '2026 B2B営業 名刺スキャンAI自動化の導入事例', comments: 28, board: '営業・マーケ' },
          { rank: 3, title: 'スタートアップ C-Level 交流会＆ネットワーキング', comments: 19, board: 'CEO・経営' },
          { rank: 4, title: 'Remember 名刺連携機能による顧客管理のコツ', comments: 34, board: 'Q&A' },
          { rank: 5, title: '有給休暇の活用と海外出張ビジネスマナー', comments: 15, board: 'フリートーク' },
        ].map((item) => (
          <div
            key={item.rank}
            onClick={onNavigateCommunity}
            className="flex items-start gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className={`font-black text-xs w-4 text-center ${item.rank <= 3 ? 'text-[#C9483B]' : 'text-gray-400'}`}>
              {item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 group-hover:text-[#0A0A0A] transition-colors line-clamp-1">
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                <span>{item.board}</span>
                <span>・</span>
                <span className="flex items-center gap-0.5 text-[#0A0A0A] font-medium">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {item.comments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Suggested Professional Connections */}
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
      <h3 className="font-bold text-sm text-gray-900 mb-3">おすすめビジネスネットワーク</h3>
      <div className="space-y-3">
        {[
          { name: '山田 太郎', company: 'LINEヤフー株式会社', role: 'プロダクトマネージャー' },
          { name: '佐藤 健太', company: 'CyberAgent Inc.', role: 'マーケティングリード' },
          { name: '鈴木 花子', company: 'Rakuten Group', role: 'B2B Business Dev' },
        ].map((prof, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                {prof.name[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{prof.name}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[130px]">{prof.company}</p>
              </div>
            </div>
            <button className="px-2.5 py-1 bg-gray-100 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors rounded-md text-[11px] font-bold">
              + Connect
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* App & Digital Business Card QR Widget */}
    <div className="bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2B2B2B] text-white rounded-xl p-4 shadow-xs flex items-center gap-4">
      <div className="bg-white p-2 rounded-lg shrink-0">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '?c=billionaire_demo')}`}
          alt="Mobile App QR"
          className="w-16 h-16"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-amber-300">スマホ名刺スキャン Sync</p>
        <p className="text-[11px] text-blue-100 mt-1 leading-snug">
          QRコードをスキャンして、モバイルアプリとデジタル名刺をすぐに確認できます。
        </p>
      </div>
    </div>

    {/* Desktop Footer */}
    <div className="text-[11px] text-gray-400 space-y-1.5 px-2">
      <div className="flex flex-wrap gap-2 text-gray-500 font-medium">
        <a href="#" className="hover:underline">利用規約</a>
        <span>・</span>
        <a href="#" className="hover:underline font-bold text-gray-700">プライバシーポリシー</a>
        <span>・</span>
        <a href="#" className="hover:underline">ヘルプセンター</a>
        <span>・</span>
        <a href="#" className="hover:underline">会社概要</a>
      </div>
      <p>© 2026 Billionaire Inc. All rights reserved.</p>
    </div>
  </aside>
);
