import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Smartphone, 
  MapPin, 
  Globe, 
  Download, 
  Share2, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  QrCode,
  UserPlus,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { digitalCardService, contactService } from '../services/firestoreService';
import { DigitalCard } from '../types/db';

interface PublicCardViewProps {
  handle: string;
  onBackToApp?: () => void;
  currentUserId?: string | null;
}

export const PublicCardView: React.FC<PublicCardViewProps> = ({ handle, onBackToApp, currentUserId }) => {
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCard() {
      setLoading(true);
      try {
        const fetchedCard = await digitalCardService.getCardByHandle(handle);
        if (isMounted) {
          setCard(fetchedCard);
        }
      } catch (err) {
        console.error('Failed to load card:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCard();
    return () => {
      isMounted = false;
    };
  }, [handle]);

  // Generate vCard (.vcf) download
  const handleDownloadVCard = () => {
    if (!card) return;

    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${card.lastName || ''};${card.firstName || ''};;;`,
      `FN:${card.lastName || ''} ${card.firstName || ''}`,
      `ORG:${card.companyName || ''}${card.department ? ';' + card.department : ''}`,
      `TITLE:${card.title || ''}`,
      card.telCompany ? `TEL;TYPE=WORK,VOICE:${card.telCompany}` : '',
      card.telMobile ? `TEL;TYPE=CELL,VOICE:${card.telMobile}` : '',
      card.email ? `EMAIL;TYPE=WORK:${card.email}` : '',
      card.address ? `ADR;TYPE=WORK:;;${card.address};;;;` : '',
      card.website ? `URL:${card.website}` : '',
      card.introText ? `NOTE:${card.introText}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${card.lastName}_${card.firstName}_business_card.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Public Link
  const handleCopyLink = () => {
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Save to Billionaire Contacts
  const handleSaveToBillionaire = async () => {
    if (!card) return;
    setSaving(true);
    try {
      await contactService.addContact({
        ownerId: currentUserId || 'guest',
        source: 'import',
        companyName: card.companyName,
        companyNameKana: card.companyNameKana || '',
        department: card.department || '',
        title: card.title || '',
        lastName: card.lastName,
        firstName: card.firstName,
        lastNameKana: card.lastNameKana || '',
        firstNameKana: card.firstNameKana || '',
        email: card.email,
        telCompany: card.telCompany || '',
        telMobile: card.telMobile || '',
        address: card.address || '',
        website: card.website || '',
        memo: `Public Digital Card Import (@${card.handle})`,
        tags: ['デジタル名刺', 'Billionaire'],
        linkedUserId: card.userId,
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save to Billionaire contacts:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-ink-muted font-medium">デジタル名刺を読み込み中...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-danger/10 text-accent rounded-2xl flex items-center justify-center mb-4 font-bold text-xl">
          404
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">名刺が見つかりません</h2>
        <p className="text-sm text-ink-muted max-w-md mb-6">
          指定されたID (<code>@{handle}</code>) のデジタル名刺は存在しないか、非公開に設定されています。
        </p>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary transition-colors"
          >
            Billionaire トップへ戻る
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink py-8 px-4 flex flex-col items-center">
      {/* Top Navigation Bar */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBackToApp && (
            <button 
              onClick={onBackToApp}
              className="p-2.5 -m-0.5 rounded-lg bg-surface border border-line text-ink-muted hover:bg-canvas text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              アプリに戻る
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-warning-on-dark" />
          BILLIONAIRE DIGITAL
        </div>
      </div>

      {/* Main Digital Business Card Shell */}
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-line overflow-hidden transition-all">
        {/* Header Branding Banner */}
        <div className="bg-gradient-to-r from-[#0A0A0A] via-[#1C1C1C] to-[#2B2B2B] text-white p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-widest uppercase text-white/70 bg-surface/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              VERIFIED BUSINESS CARD
            </span>
            <button 
              onClick={() => setShowQrModal(true)}
              className="tap-44 p-2.5 -m-0.5 bg-surface/10 hover:bg-surface/20 rounded-lg text-white transition-colors"
              title="QRコードを表示"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-white/80" />
            <h3 className="text-base font-semibold tracking-tight text-white/95">
              {card.companyName}
            </h3>
            <ShieldCheck className="w-4 h-4 text-success-on-dark" title="企業認証済み" />
          </div>
          {card.department && (
            <p className="text-xs text-white/70 font-medium ml-7">{card.department}</p>
          )}

          <div className="mt-8">
            {card.lastNameKana && card.firstNameKana && (
              <p className="text-xs text-white/70 font-normal tracking-wider mb-0.5">
                {card.lastNameKana} {card.firstNameKana}
              </p>
            )}
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-white tracking-wide">
                {card.lastName} {card.firstName}
              </h1>
              {card.title && (
                <span className="text-sm font-medium text-warning-on-dark bg-warning-on-dark/20 px-2 py-0.5 rounded text-xs">
                  {card.title}
                </span>
              )}
            </div>
          </div>

          {/* Japanese Inkan / Signature Stamp Emblem Accent */}
          <div className="absolute right-6 bottom-5 w-12 h-12 rounded-full border-2 border-accent/80 bg-accent/10 flex items-center justify-center text-accent font-serif text-xs font-bold pointer-events-none opacity-80">
            {card.lastName?.[0] || '印'}
          </div>
        </div>

        {/* Card Contact Details Body */}
        <div className="p-6 space-y-4 text-sm">
          {card.email && (
            <div className="flex items-center gap-3 text-ink hover:text-primary transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] text-ink-faint font-medium">メールアドレス</p>
                <a href={`mailto:${card.email}`} className="font-medium text-xs sm:text-sm hover:underline block truncate">
                  {card.email}
                </a>
              </div>
            </div>
          )}

          {card.telMobile && (
            <div className="flex items-center gap-3 text-ink">
              <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-medium">携帯電話</p>
                <a href={`tel:${card.telMobile}`} className="font-medium text-xs sm:text-sm hover:underline">
                  {card.telMobile}
                </a>
              </div>
            </div>
          )}

          {card.telCompany && (
            <div className="flex items-center gap-3 text-ink">
              <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-medium">会社電話</p>
                <a href={`tel:${card.telCompany}`} className="font-medium text-xs sm:text-sm hover:underline">
                  {card.telCompany}
                </a>
              </div>
            </div>
          )}

          {card.address && (
            <div className="flex items-start gap-3 text-ink">
              <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-medium">所在地</p>
                <p className="text-xs sm:text-sm text-ink leading-snug">{card.address}</p>
              </div>
            </div>
          )}

          {card.website && (
            <div className="flex items-center gap-3 text-ink">
              <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] text-ink-faint font-medium">Webサイト</p>
                <a 
                  href={card.website.startsWith('http') ? card.website : `https://${card.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 truncate"
                >
                  {card.website}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {card.introText && (
            <div className="pt-2 border-t border-line mt-4">
              <p className="text-[11px] text-ink-faint font-medium mb-1">Self Introduction / メッセージ</p>
              <p className="text-xs text-ink-muted whitespace-pre-wrap leading-relaxed bg-canvas p-3 rounded-lg border border-line">
                {card.introText}
              </p>
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="p-6 bg-canvas border-t border-line space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadVCard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium text-xs sm:text-sm rounded-lg hover:bg-primary active:scale-[0.99] transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              vCard 保存 (.vcf)
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-line text-ink font-medium text-xs sm:text-sm rounded-lg hover:bg-canvas active:scale-[0.99] transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-success">コピー完了</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-ink-muted" />
                  リンクを共有
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleSaveToBillionaire}
            disabled={saved || saving}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all shadow-sm ${
              saved
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-gradient-to-r from-[#C9483B] to-[#B03A2E] text-white hover:opacity-95'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-success" />
                Billionaire 名刺帳に追加済み
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {saving ? '保存中...' : 'Billionaire 名刺帳に保存'}
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-surface text-center border-t border-line">
          <p className="text-[11px] text-ink-faint">
            Powered by <span className="font-bold text-primary">Billionaire (ビリオネア)</span> 名刺ネットワーク
          </p>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-ink">名刺交換用 QRコード</h3>
            <p className="text-xs text-ink-muted">
              スマホのカメラでスキャンすると、このデジタル名刺にアクセスできます。
            </p>
            <div className="bg-canvas p-6 rounded-lg inline-block border border-line">
              {/* High-Contrast Simulated QR Code with Logo */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                alt="Digital Card QR Code"
                className="w-48 h-48 mx-auto rounded-lg shadow-sm"
              />
            </div>
            <p className="text-[11px] text-ink-faint">
              @{card.handle}
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-primary-soft text-ink font-medium text-xs rounded-lg hover:bg-primary-soft transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
