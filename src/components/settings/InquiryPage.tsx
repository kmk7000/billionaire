import React, { useRef, useState } from 'react';
import { ArrowLeft, Paperclip, X, ChevronRight, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from 'firebase/auth';
import { resizeImage } from '../../utils/imageUtils';
import { submitInquiry, MAX_INQUIRY_ATTACHMENTS } from '../../services/inquiryService';

interface InquiryPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  /** Lets the user jump to where the contact address can actually be changed. */
  onOpenAccountManagement: () => void;
}

const MAX_BODY_LENGTH = 5000;

export const InquiryPage: React.FC<InquiryPageProps> = ({
  isOpen, onClose, user, onOpenAccountManagement,
}) => {
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const email = user?.email || '';
  const canSubmit = email.length > 0 && body.trim().length > 0 && !isSubmitting;

  const reset = () => {
    setBody('');
    setAttachments([]);
    setIsPrivacyOpen(false);
    setIsDone(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Annotated because React's types aren't installed, so the event is `any`
    // and Array.from would otherwise widen the elements to `unknown`.
    const files: File[] = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const room = MAX_INQUIRY_ATTACHMENTS - attachments.length;
    if (room <= 0) return;

    setError(null);
    const accepted = files.slice(0, room);
    const encoded = await Promise.all(
      accepted.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                // Shrink before storing: these end up inline in Firestore.
                resolve(await resizeImage(reader.result as string, 1000, 1000));
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

    setAttachments((prev) => [...prev, ...encoded].slice(0, MAX_INQUIRY_ATTACHMENTS));
    if (files.length > room) {
      setError(`スクリーンショットは最大${MAX_INQUIRY_ATTACHMENTS}枚までです。`);
    }
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitInquiry({
        userId: user.uid,
        email,
        body: body.trim().slice(0, MAX_BODY_LENGTH),
        attachments,
      });
      setIsDone(true);
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-surface z-[120] flex flex-col max-w-md mx-auto pt-safe"
        >
          <header className="sticky top-0 z-10 bg-surface border-b border-line h-[52px] flex items-center px-4 gap-3">
            <button aria-label="戻る" onClick={handleClose} className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-lg font-bold text-ink">1:1 お問い合わせ</h1>
          </header>

          {isDone ? (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-success" />
              <h2 className="text-lg font-bold text-ink">お問い合わせを送信しました</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                ご入力のメールアドレス宛に、担当者よりご連絡いたします。
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-3 rounded-lg bg-primary text-white font-bold"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
                {/* Contact address — read-only, it comes from the account */}
                <label className="block text-[15px] font-bold text-ink mb-2">
                  連絡先メールアドレス <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  placeholder="メールアドレスが未設定です"
                  className="w-full bg-canvas border border-line rounded-lg px-4 py-3.5 text-[15px] text-ink-faint"
                />
                <p className="text-[13px] text-ink-muted mt-2 leading-relaxed">
                  メールアドレスは
                  <button
                    onClick={onOpenAccountManagement}
                    className="text-ink font-medium underline underline-offset-2"
                  >
                    [設定]&gt;[アカウント管理]
                  </button>
                  から変更できます。
                </p>

                {/* Inquiry body */}
                <label className="block text-[15px] font-bold text-ink mt-6 mb-2">
                  お問い合わせ内容 <span className="text-danger">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY_LENGTH))}
                  placeholder="お問い合わせ内容をご記入ください"
                  className="w-full min-h-[220px] bg-canvas border border-line rounded-lg px-4 py-3.5 text-[15px] text-ink placeholder-ink-faint resize-none focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-right text-[11px] text-ink-faint mt-1">
                  {body.length} / {MAX_BODY_LENGTH}
                </p>

                {/* Screenshots */}
                <h2 className="text-[15px] font-bold text-ink mt-6 mb-2">スクリーンショット</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_INQUIRY_ATTACHMENTS}
                  className="w-full flex items-center justify-between bg-canvas border border-line rounded-lg px-4 py-3.5 text-[15px] font-bold text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>+ ファイルを追加</span>
                  <Paperclip className="w-5 h-5 text-ink-muted" />
                </button>
                <p className="text-[13px] text-ink-muted mt-2 leading-relaxed">
                  問題が発生した画面のスクリーンショットを添付できます。画像は最大
                  {MAX_INQUIRY_ATTACHMENTS}枚まで選択できます。
                </p>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {attachments.map((src, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          aria-label="添付を削除"
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/70 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Privacy notice: expands inline rather than linking to a page
                    that does not exist yet. */}
                <button
                  onClick={() => setIsPrivacyOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between mt-8 py-4 border-t border-line text-[15px] text-ink"
                >
                  <span>個人情報の収集および利用について</span>
                  {isPrivacyOpen
                    ? <ChevronDown className="w-5 h-5 text-ink-faint" />
                    : <ChevronRight className="w-5 h-5 text-ink-faint" />}
                </button>
                {isPrivacyOpen && (
                  <p className="text-[13px] text-ink-muted leading-relaxed bg-canvas rounded-lg p-4 -mt-1">
                    お問い合わせの対応のため、メールアドレス・お問い合わせ内容・添付画像を収集します。
                    収集した情報は回答および品質改善の目的にのみ利用し、対応完了後3年間保管したのち削除します。
                    同意されない場合もお問い合わせは可能ですが、ご回答ができない場合があります。
                  </p>
                )}

                {error && <p className="text-[13px] text-danger mt-4">{error}</p>}
              </div>

              <div className="p-5 border-t border-line bg-surface pb-safe">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`w-full py-4 rounded-lg font-bold transition-colors duration-200 flex items-center justify-center gap-2 ${
                    canSubmit
                      ? 'bg-primary text-white hover:opacity-90'
                      : 'bg-primary-soft text-ink-faint cursor-not-allowed'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  お問い合わせする
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
