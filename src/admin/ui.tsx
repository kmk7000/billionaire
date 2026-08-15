// Shared primitives for the operator console.
//
// Design brief (ui-ux-pro-max, density 9 / variance 2 / motion 2): dense
// dashboard rhythm, high-contrast minimalism, no decoration. The palette stays
// on the product's own semantic tokens rather than the generator's blue/amber
// suggestion — swapping palettes between a product and the console that
// administers it breaks the `consistency` rule the same guide puts at
// priority 4, and `color-semantic` forbids raw hex in components either way.
//
// Data columns use `font-mono` (`number-tabular`): IDs, timestamps and counts
// must not reflow as digits change.

import React from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

export type Tone = 'neutral' | 'open' | 'progress' | 'done' | 'danger';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-primary-soft text-ink-muted',
  open: 'bg-accent/10 text-accent',
  progress: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
};

/** Status pill. The label is always text — colour never carries meaning alone. */
export const Badge: React.FC<{ label: string; tone?: Tone }> = ({ label, tone = 'neutral' }) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${TONE_CLASS[tone]}`}
  >
    {label}
  </span>
);

export const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children, className = '',
}) => <span className={`font-mono text-[12px] ${className}`}>{children}</span>;

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider mb-2">{children}</h2>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex gap-3 py-2 border-b border-line last:border-b-0">
    <span className="w-24 shrink-0 text-[12px] text-ink-faint pt-px">{label}</span>
    <div className="flex-1 min-w-0 text-[13px] text-ink break-words">{children}</div>
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-1.5">
    <p className="text-[14px] font-bold text-ink">{title}</p>
    {hint && <p className="text-[12px] text-ink-muted leading-relaxed max-w-md">{hint}</p>}
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = '読み込み中' }) => (
  <div className="flex items-center justify-center py-20 gap-2 text-ink-muted">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span className="text-[13px]">{label}</span>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
    <AlertCircle className="w-6 h-6 text-danger" />
    <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry}>再読み込み</Button>
    )}
  </div>
);

export const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, children, tone = 'default', disabled, type = 'button' }) => {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary text-white hover:opacity-90'
      : tone === 'danger'
        ? 'border border-danger/30 text-danger hover:bg-danger/5'
        : 'border border-line text-ink bg-surface hover:bg-canvas';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 px-3 rounded-md text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 ${toneClass}`}
    >
      {children}
    </button>
  );
};

/** Segmented filter above each table. */
export const FilterChips: React.FC<{
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex gap-1.5 flex-wrap">
    {options.map((option) => {
      const isActive = option.value === value;
      return (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          aria-pressed={isActive}
          className={`h-8 px-2.5 rounded-md text-[12px] font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
            isActive
              ? 'bg-primary text-white'
              : 'bg-surface text-ink-muted border border-line hover:bg-canvas'
          }`}
        >
          {option.label}
          {typeof option.count === 'number' && (
            <span className="ml-1.5 font-mono opacity-70">{option.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

/** Table chrome. Wide content scrolls inside the wrapper, never the page. */
export const Table: React.FC<{ head: React.ReactNode; children: React.ReactNode }> = ({
  head, children,
}) => (
  <div className="border border-line rounded-lg bg-surface overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead className="bg-canvas">{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </div>
);

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children, className = '',
}) => (
  <th
    scope="col"
    className={`px-3 py-2 text-[11px] font-bold text-ink-faint uppercase tracking-wider border-b border-line whitespace-nowrap ${className}`}
  >
    {children}
  </th>
);

export const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children, className = '',
}) => <td className={`px-3 py-2.5 text-[13px] text-ink align-top ${className}`}>{children}</td>;

export const Tr: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}> = ({ children, onClick, isActive }) => (
  <tr
    onClick={onClick}
    tabIndex={onClick ? 0 : undefined}
    role={onClick ? 'button' : undefined}
    onKeyDown={(e: any) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    }}
    className={`border-b border-line last:border-b-0 transition-colors ${
      onClick ? 'cursor-pointer hover:bg-canvas focus:outline-none focus-visible:bg-canvas' : ''
    } ${isActive ? 'bg-canvas' : ''}`}
  >
    {children}
  </tr>
);

/**
 * Right-hand case drawer. The table keeps full width for scanning; the detail
 * slides over it for the one case being worked. Escape and the scrim both
 * dismiss (`modal-escape`).
 */
export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, footer, children }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-ink/40 z-40 animate-[fadeIn_150ms_ease-out]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 bottom-0 w-full max-w-[520px] bg-surface border-l border-line z-50 flex flex-col shadow-lg animate-[slideIn_200ms_ease-out]"
      >
        <header className="flex items-center gap-2 px-4 h-14 border-b border-line shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">{title}</div>
          <button
            aria-label="閉じる"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-canvas transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-line p-3 flex flex-wrap gap-2 shrink-0">{footer}</footer>
        )}
      </aside>
    </>
  );
};

export function formatDateTime(value: any): string {
  if (!value) return '—';
  const date: Date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

/** Hours since a case opened — drives the SLA warnings. */
export function hoursSince(value: any): number | null {
  if (!value) return null;
  const date: Date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 3600000);
}

export const INQUIRY_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  open: { label: '未対応', tone: 'open' },
  in_progress: { label: '対応中', tone: 'progress' },
  resolved: { label: '対応済み', tone: 'done' },
};

export const REPORT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  open: { label: '未対応', tone: 'open' },
  reviewing: { label: '確認中', tone: 'progress' },
  actioned: { label: '措置済み', tone: 'done' },
  dismissed: { label: '却下', tone: 'neutral' },
};

export const CONTENT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  published: { label: '公開中', tone: 'done' },
  held: { label: '保留', tone: 'progress' },
  hidden: { label: '非表示', tone: 'danger' },
  deleted: { label: '削除済み', tone: 'neutral' },
};

export const REPORT_REASON_LABEL: Record<string, string> = {
  inappropriate: '不適切な内容',
  harassment: '嫌がらせ',
  spam: 'スパム',
  confidential_leak: '機密情報の漏洩',
  impersonation: 'なりすまし',
};

export const REPORT_TARGET_LABEL: Record<string, string> = {
  post: '投稿',
  comment: 'コメント',
  user: 'ユーザー',
  card: '名刺',
};

/** Response target recorded alongside ReportItem in src/types/db.ts. */
export const SLA_HOURS = 24;

export const AUDIT_ACTION_META: Record<string, { label: string; tone: Tone }> = {
  inquiry_view: { label: '閲覧', tone: 'neutral' },
  inquiry_status: { label: '状態変更', tone: 'progress' },
  inquiry_note: { label: 'メモ保存', tone: 'neutral' },
  report_view: { label: '閲覧', tone: 'neutral' },
  report_status: { label: '状態変更', tone: 'progress' },
  report_note: { label: 'メモ保存', tone: 'neutral' },
  post_hide: { label: '非表示化', tone: 'danger' },
  post_restore: { label: '公開に復元', tone: 'done' },
  comment_hide: { label: '非表示化', tone: 'danger' },
  comment_restore: { label: '公開に復元', tone: 'done' },
};

export const AUDIT_TARGET_LABEL: Record<string, string> = {
  inquiry: 'お問い合わせ',
  report: '通報',
  post: '投稿',
  comment: 'コメント',
};
