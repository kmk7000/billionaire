import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, Copy, ExternalLink, Globe, Lock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PublicCardState } from '../../hooks/usePublicCard';

interface PublicCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicCard: PublicCardState;
  onPreview: (handle: string) => void;
  hasMyMeishi: boolean;
}

type Availability =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'error'; message: string };

export const PublicCardModal: React.FC<PublicCardModalProps> = ({
  isOpen, onClose, publicCard, onPreview, hasMyMeishi,
}) => {
  const { handle, isPublic, publicUrl, saveHandle, setPublic, checkHandle, refreshFromMeishi, isStale } = publicCard;
  const [draft, setDraft] = useState('');
  const [availability, setAvailability] = useState<Availability>({ state: 'idle' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(handle ?? '');
      setAvailability({ state: 'idle' });
    }
  }, [isOpen, handle]);

  // Debounced availability check so we don't hit Firestore on every keystroke.
  useEffect(() => {
    const trimmed = draft.trim().toLowerCase();
    if (!trimmed || trimmed === handle) {
      setAvailability({ state: 'idle' });
      return;
    }
    setAvailability({ state: 'checking' });
    const timer = setTimeout(async () => {
      const result = await checkHandle(trimmed);
      setAvailability(result.ok ? { state: 'ok' } : { state: 'error', message: result.reason });
    }, 400);
    return () => clearTimeout(timer);
  }, [draft, handle, checkHandle]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveHandle(draft);
    setSaving(false);
    if (!result.ok) {
      setAvailability({ state: 'error', message: result.reason });
    }
  };

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUnchanged = draft.trim().toLowerCase() === (handle ?? '');
  const canSave = draft.trim().length > 0 && !isUnchanged && availability.state === 'ok' && !saving;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 z-[130]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: '-48%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, y: '-48%', x: '-50%' }}
            className="fixed top-1/2 left-1/2 w-[92%] max-w-md bg-surface rounded-2xl z-[140] shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="text-base font-bold text-ink">公開デジタル名刺</h2>
              <button aria-label="閉じる" onClick={onClose} className="p-1 -mr-1 text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {!hasMyMeishi && (
                <div className="bg-warning/10 text-warning text-xs rounded-lg p-3 leading-relaxed">
                  マイ名刺が未登録です。先に自分の名刺を登録すると、会社名や連絡先が公開名刺に反映されます。
                </div>
              )}

              {/* Handle input */}
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">
                  公開ID（URLに使われます）
                </label>
                <div className="flex items-center border border-line rounded-lg focus-within:border-primary transition-colors">
                  <span className="pl-3 text-sm text-ink-faint select-none">@</span>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                    placeholder="yamada_taro"
                    maxLength={30}
                    className="flex-1 px-2 py-3 text-[15px] text-ink placeholder-ink-faint outline-none bg-transparent"
                  />
                  <span className="pr-3">
                    {availability.state === 'checking' && <Loader2 className="w-4 h-4 text-ink-faint animate-spin" />}
                    {availability.state === 'ok' && <Check className="w-4 h-4 text-success" />}
                  </span>
                </div>
                {availability.state === 'error' && (
                  <p className="text-xs text-danger mt-2">{availability.message}</p>
                )}
                {availability.state === 'ok' && (
                  <p className="text-xs text-success mt-2">このIDは使用できます。</p>
                )}
                <p className="text-[11px] text-ink-faint mt-2 leading-relaxed">
                  半角英数字と _ のみ、3〜30文字。あとから変更できますが、以前のURLは使えなくなります。
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`w-full py-3.5 rounded-lg font-bold transition-colors duration-200 ${
                  canSave ? 'bg-primary text-white hover:opacity-90' : 'bg-primary-soft text-ink-faint cursor-not-allowed'
                }`}
              >
                {saving ? '保存中...' : handle ? 'IDを変更する' : 'IDを登録する'}
              </button>

              {/* Live link + visibility, only once a handle exists */}
              {handle && publicUrl && (
                <div className="pt-4 border-t border-line space-y-4">
                  <div>
                    <p className="text-xs font-bold text-ink-muted mb-2">公開URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-ink bg-canvas rounded-lg px-3 py-2.5 truncate">
                        {publicUrl}
                      </code>
                      <button
                        onClick={handleCopy}
                        aria-label="URLをコピー"
                        className="p-2.5 rounded-lg bg-canvas text-ink-muted hover:bg-primary-soft transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onPreview(handle)}
                        aria-label="公開名刺を開く"
                        className="p-2.5 rounded-lg bg-canvas text-ink-muted hover:bg-primary-soft transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isStale && (
                    <div className="bg-warning/10 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-warning leading-relaxed">
                        名刺やプロフィールを更新した内容が、公開名刺にまだ反映されていません。
                      </p>
                      <button
                        onClick={async () => {
                          setRefreshing(true);
                          await refreshFromMeishi();
                          setRefreshing(false);
                        }}
                        disabled={refreshing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface border border-line text-xs font-bold text-ink hover:bg-canvas transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        最新の内容に更新する
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setPublic(!isPublic)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-canvas hover:bg-primary-soft transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                      {isPublic ? <Globe className="w-4 h-4 text-success" /> : <Lock className="w-4 h-4 text-ink-faint" />}
                      {isPublic ? '公開中' : '非公開'}
                    </span>
                    <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isPublic ? 'bg-success' : 'bg-line'}`}>
                      <span className={`block w-5 h-5 rounded-full bg-surface shadow-sm transition-transform ${isPublic ? 'translate-x-5' : ''}`} />
                    </span>
                  </button>
                  <p className="text-[11px] text-ink-faint leading-relaxed">
                    非公開にすると、URLを知っている人でも名刺を閲覧できなくなります。
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
