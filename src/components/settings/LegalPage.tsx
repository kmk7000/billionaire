import React from 'react';
import { SettingsSubPage, SubPageSection } from './SettingsSubPage';

// 法的通知.
//
// The data-handling section below is factual: every item was read off what the
// app actually does (Firebase Auth/Firestore, server-side Gemini OCR, Google
// Geocoding, images stored as data URLs). It is safe to ship because it
// describes real behaviour.
//
// 利用規約 and the formal 個人情報保護方針 are deliberately NOT written here.
// Those are legal instruments that bind the operator and must be drafted and
// reviewed by them — plausible-sounding placeholder terms would be worse than
// none, because users would reasonably take them as binding. The section says
// so plainly and points at 1:1 お問い合わせ in the meantime.

export const LegalPage: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen, onClose,
}) => (
  <SettingsSubPage isOpen={isOpen} onClose={onClose} title="法的通知">
    <SubPageSection title="取得する情報">
      <p>本アプリでは、以下の情報を取得・保存します。</p>
      <ul className="list-disc pl-4 space-y-1.5">
        <li>アカウント情報（メールアドレス、表示名、プロフィール写真）</li>
        <li>お客様が登録した名刺の記載内容および画像</li>
        <li>プロフィール（経歴・学歴・スキル等、お客様が入力された範囲）</li>
        <li>コミュニティへの投稿・コメント</li>
        <li>お問い合わせの内容および添付画像</li>
      </ul>
    </SubPageSection>

    <SubPageSection title="外部サービスの利用">
      <ul className="list-disc pl-4 space-y-1.5">
        <li>
          <span className="font-bold text-ink">Google Firebase</span>：
          認証およびデータの保存に利用します。
        </li>
        <li>
          <span className="font-bold text-ink">Google Gemini</span>：
          名刺の文字認識に利用します。画像は当社サーバーを経由して送信され、
          認識結果の取得のみに使用します。
        </li>
        <li>
          <span className="font-bold text-ink">Google Maps / Geocoding</span>：
          名刺の住所を地図上に表示するため、住所を座標に変換します。
          変換結果は名刺に保存し、同じ住所を繰り返し送信しません。
        </li>
      </ul>
    </SubPageSection>

    <SubPageSection title="名刺情報の取り扱い">
      <p>
        お客様が登録した名刺は、<span className="font-bold text-ink">お客様ご本人のみが閲覧できます</span>。
        他の利用者に共有されることはありません。
      </p>
      <p>
        「マイ名刺を共有する」で公開URLを発行した場合に限り、
        そのURLを知っている方がお客様ご自身の名刺を閲覧できます。公開はいつでも停止でき、
        停止後はURLを知っていても表示されません。
      </p>
    </SubPageSection>

    <SubPageSection title="コミュニティでの匿名性">
      <p>
        投稿およびコメントには匿名ニックネームと業種・職種のみが表示されます。
        お名前・会社名・メールアドレスが他の利用者に表示されることはありません。
      </p>
    </SubPageSection>

    <SubPageSection title="利用規約・個人情報保護方針">
      <p>
        正式な利用規約および個人情報保護方針は現在準備中です。
        内容が確定次第、本画面に掲載します。
      </p>
      <p>
        ご不明な点は[もっと見る]&gt;[1:1 お問い合わせ]よりご連絡ください。
      </p>
    </SubPageSection>

    <div className="px-5 py-6">
      <p className="text-[12px] text-ink-faint">© 2026 Billionaire</p>
    </div>
  </SettingsSubPage>
);
