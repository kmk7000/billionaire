import React from 'react';
import { IdCard, MapPin, MessagesSquare, Share2 } from 'lucide-react';
import { SettingsSubPage } from './SettingsSubPage';

// プロローグ — what this app is for, in the operator's own words.
//
// Each item describes something that is actually built and reachable today;
// nothing here promises a feature that does not exist yet.

const CHAPTERS: { icon: any; title: string; body: string }[] = [
  {
    icon: IdCard,
    title: '受け取った名刺を、探せる形で残す',
    body: '撮影するだけで傾きと影を補正し、会社名・お名前・連絡先を読み取ります。引き出しに眠る名刺の束が、名前でも会社でも職種でも引ける名刺帳になります。',
  },
  {
    icon: MapPin,
    title: '取引先を地図で捉える',
    body: '登録された名刺の住所を地図に配置します。訪問先の近くにどの取引先があるのかが一目でわかり、一度の外出をまとめて活かせます。',
  },
  {
    icon: Share2,
    title: '紙がなくても渡せる',
    body: '自分の名刺は公開URLひとつで渡せます。切らしていても、オンラインの打ち合わせでも問題ありません。公開はいつでも停止できます。',
  },
  {
    icon: MessagesSquare,
    title: '社名を明かさずに、同じ立場の人と話す',
    body: 'コミュニティでの投稿は匿名ニックネームと業種・職種のみが表示されます。転職、評価、人間関係——社内では聞きにくいことを、同じ立場の人に聞けます。',
  },
];

export const ProloguePage: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen, onClose,
}) => (
  <SettingsSubPage isOpen={isOpen} onClose={onClose} title="プロローグ">
    <div className="px-5 pt-8 pb-6">
      <p className="text-[22px] font-bold text-ink leading-relaxed mb-3">
        名刺は、
        <br />
        交換した瞬間に終わらない。
      </p>
      <p className="text-[14px] text-ink-muted leading-relaxed">
        Billionaire は、受け取った名刺を「使える資産」に変え、
        <br />
        働く人どうしが安心して話せる場所をつくります。
      </p>
    </div>

    <div className="px-5 pb-8 space-y-6">
      {CHAPTERS.map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex gap-4">
          <span className="w-10 h-10 rounded-full bg-canvas border border-line flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-ink" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-ink mb-1.5 leading-relaxed">{title}</h2>
            <p className="text-[14px] text-ink-muted leading-relaxed">{body}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="px-5 py-6 bg-canvas">
      <p className="text-[13px] text-ink-muted leading-relaxed">
        名刺の情報は、ご本人と、名刺を受け取ったご本人以外には公開されません。
        コミュニティでの投稿にお名前や会社名が結びつくこともありません。
      </p>
    </div>
  </SettingsSubPage>
);
