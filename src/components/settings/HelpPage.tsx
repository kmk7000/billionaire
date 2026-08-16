import React, { useState } from 'react';
import { ChevronDown, Headset } from 'lucide-react';
import { SettingsSubPage } from './SettingsSubPage';

// ヘルプ. The answers describe how this app actually behaves today — including
// where a feature is limited or not yet delivered — rather than describing an
// aspirational product. Anything that is still unbuilt is said plainly.

const FAQ: { q: string; a: string }[] = [
  {
    q: '名刺はどうやって登録しますか？',
    a: '画面右下の「名刺登録」から撮影するか、[もっと見る]>[アルバムから名刺を取り込む]で写真を選びます。手元に名刺がない場合は[名刺を直接入力]から手入力もできます。撮影した名刺は自動で傾きや影を補正し、記載内容を読み取ります。',
  },
  {
    q: '読み取った内容が間違っています。',
    a: '名刺を開いて[編集]から修正できます。読み取り精度は撮影条件に左右されるため、明るい場所で、名刺全体が枠に入るように撮影すると改善します。',
  },
  {
    q: 'マイ名刺を相手に渡すには？',
    a: '[マイプロフィール]>[マイ名刺]の「マイ名刺を共有する」から公開URLを発行できます。URLを知っている人だけが閲覧でき、公開を停止すればURLを知っていても表示されなくなります。',
  },
  {
    q: '転職したら古い名刺はどうなりますか？',
    a: '新しいマイ名刺を登録すると、それまでの名刺は「名刺ヒストリー」に移動します。名刺帳の一覧には表示されなくなりますが、履歴としてマイ名刺の画面に残ります。',
  },
  {
    q: '着信時に相手の名刺情報を表示できますか？',
    a: 'iOSでのみ利用できます。[もっと見る]>[着信時に相手の名刺情報を表示]から、iOSの[設定]>[電話]>[通話のブロックと識別]でオンにしてください。iOSの仕様上、表示されるのは会社名とお名前のみで、反映のタイミングはiOSが判断するため即時ではありません。',
  },
  {
    q: 'コミュニティの投稿は実名で表示されますか？',
    a: 'いいえ。投稿とコメントは匿名ニックネームと業種・職種のみが表示され、お名前や会社名が他の利用者に伝わることはありません。',
  },
  {
    q: '不適切な投稿を見つけました。',
    a: '投稿またはコメントのメニューから通報できます。運営が内容を確認し、必要に応じて非表示などの対応を行います。特定の利用者の投稿を今後表示したくない場合はブロックもご利用ください。',
  },
  {
    q: '通知が届きません。',
    a: 'プッシュ通知の配信は現在準備中です。[設定]>[通知管理]で受け取りたい種類をあらかじめ設定しておくことができます。',
  },
  {
    q: '退会したいです。',
    a: '[設定]>[アカウント管理]>[退会]から手続きできます。退会すると登録した名刺やプロフィールは削除され、復元できません。',
  },
];

export const HelpPage: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry: () => void;
}> = ({ isOpen, onClose, onOpenInquiry }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SettingsSubPage isOpen={isOpen} onClose={onClose} title="ヘルプ">
      <div className="px-5 py-2">
        {FAQ.map((item, index) => {
          const isOpenItem = openIndex === index;
          return (
            <div key={item.q} className="border-b border-line last:border-b-0">
              <button
                onClick={() => setOpenIndex(isOpenItem ? null : index)}
                aria-expanded={isOpenItem}
                className="w-full flex items-start justify-between gap-3 py-4 text-left"
              >
                <span className="text-[15px] font-bold text-ink leading-relaxed">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-ink-faint shrink-0 mt-0.5 transition-transform ${isOpenItem ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpenItem && (
                <p className="text-[14px] text-ink-muted leading-relaxed pb-4 whitespace-pre-line">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* The escalation path the FAQ pattern asks for: never a dead end. */}
      <div className="px-5 py-6 bg-canvas mt-2">
        <p className="text-[14px] text-ink mb-3 leading-relaxed">
          解決しない場合は、担当者へ直接お問い合わせください。
        </p>
        <button
          onClick={onOpenInquiry}
          className="w-full py-4 rounded-lg bg-primary text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Headset className="w-4 h-4" />
          1:1 お問い合わせ
        </button>
      </div>
    </SettingsSubPage>
  );
};
