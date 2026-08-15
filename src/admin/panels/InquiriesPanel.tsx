// 1:1 お問い合わせ triage.
//
// Reply delivery is intentionally not implemented: sending mail needs a
// server-side sender (Cloud Functions + a mail provider) this project does not
// have. Until then the console opens the operator's own mail client with the
// reply pre-addressed and the original quoted, and records the outcome on the
// case so the queue still reflects reality.

import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Copy, Check, Paperclip } from 'lucide-react';
import {
  adminInquiryService, type AdminInquiry, type InquiryStatus,
} from '../../services/adminService';
import {
  Badge, Button, Drawer, EmptyState, Field, FilterChips, INQUIRY_STATUS_META,
  Mono, SLA_HOURS, SectionLabel, Table, Td, Th, Tr, formatDateTime, hoursSince,
} from '../ui';

interface Props {
  inquiries: AdminInquiry[];
  adminUid: string;
  onChanged: () => void;
}

const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'open', label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'resolved', label: '対応済み' },
];

export const InquiriesPanel: React.FC<Props> = ({ inquiries, adminUid, onChanged }) => {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: inquiries.length, open: 0, in_progress: 0, resolved: 0 };
    inquiries.forEach((item) => {
      const status = item.status || 'open';
      map[status] = (map[status] || 0) + 1;
    });
    return map;
  }, [inquiries]);

  const visible = useMemo(
    () => (filter === 'all' ? inquiries : inquiries.filter((i) => (i.status || 'open') === filter)),
    [inquiries, filter]
  );

  const selected = inquiries.find((item) => item.id === selectedId) || null;

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <FilterChips
          options={FILTERS.map((f) => ({ ...f, count: counts[f.value] || 0 }))}
          value={filter}
          onChange={setFilter}
        />
        <span className="ml-auto font-mono text-[11px] text-ink-faint">
          {visible.length} / {inquiries.length} 件
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="border border-line rounded-lg bg-surface">
          <EmptyState
            title="該当するお問い合わせはありません"
            hint="会員がアプリの[もっと見る]>[1:1 お問い合わせ]から送信すると、ここに表示されます。"
          />
        </div>
      ) : (
        <Table
          head={
            <tr>
              <Th className="w-[110px]">状態</Th>
              <Th className="w-[150px]">受付日時</Th>
              <Th className="w-[220px]">連絡先</Th>
              <Th>内容</Th>
              <Th className="w-[70px]">添付</Th>
            </tr>
          }
        >
          {visible.map((item) => {
            const status = item.status || 'open';
            const meta = INQUIRY_STATUS_META[status] || INQUIRY_STATUS_META.open;
            const age = hoursSince(item.createdAt);
            const isOverdue = status === 'open' && age !== null && age >= SLA_HOURS;
            return (
              <Tr key={item.id} onClick={() => setSelectedId(item.id)} isActive={item.id === selectedId}>
                <Td>
                  <div className="flex flex-col gap-1 items-start">
                    <Badge label={meta.label} tone={meta.tone} />
                    {isOverdue && <Badge label={`${age}h 経過`} tone="danger" />}
                  </div>
                </Td>
                <Td><Mono className="text-ink-muted">{formatDateTime(item.createdAt)}</Mono></Td>
                <Td><Mono className="text-ink-muted break-all">{item.email}</Mono></Td>
                <Td>
                  <span className="line-clamp-2 leading-relaxed">{item.body}</span>
                </Td>
                <Td>
                  {item.attachmentCount > 0 && (
                    <span className="flex items-center gap-1 text-ink-muted">
                      <Paperclip className="w-3.5 h-3.5" />
                      <Mono>{item.attachmentCount}</Mono>
                    </span>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}

      {selected && (
        <InquiryDrawer
          key={selected.id}
          inquiry={selected}
          adminUid={adminUid}
          onClose={() => setSelectedId(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
};

const InquiryDrawer: React.FC<{
  inquiry: AdminInquiry;
  adminUid: string;
  onClose: () => void;
  onChanged: () => void;
}> = ({ inquiry, adminUid, onClose, onChanged }) => {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [note, setNote] = useState(inquiry.adminNote || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Logged once per drawer open (the `key={inquiry.id}` on the drawer in the
  // parent list remounts this component per case, so this never double-fires
  // for the same view).
  useEffect(() => {
    adminInquiryService.logView(inquiry.id);
  }, [inquiry.id]);

  useEffect(() => {
    if (inquiry.attachmentCount <= 0) return;
    let cancelled = false;
    setIsLoadingAttachments(true);
    adminInquiryService.attachments(inquiry.id).then((urls) => {
      if (cancelled) return;
      setAttachments(urls);
      setIsLoadingAttachments(false);
    });
    return () => { cancelled = true; };
  }, [inquiry.id, inquiry.attachmentCount]);

  const apply = async (patch: { status?: InquiryStatus; adminNote?: string }) => {
    setIsSaving(true);
    try {
      await adminInquiryService.update(inquiry.id, adminUid, patch);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(inquiry.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const replyByMail = () => {
    const subject = encodeURIComponent('【Billionaire】お問い合わせの件について');
    const quoted = inquiry.body.split('\n').map((line) => `> ${line}`).join('\n');
    const body = encodeURIComponent(
      `お問い合わせいただきありがとうございます。\n\n\n\n--- お問い合わせ内容 ---\n${quoted}\n`
    );
    window.location.href = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
  };

  const status = (inquiry.status || 'open') as InquiryStatus;
  const meta = INQUIRY_STATUS_META[status];

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={
        <>
          <Badge label={meta.label} tone={meta.tone} />
          <Mono className="text-ink-faint truncate">{inquiry.id}</Mono>
        </>
      }
      footer={
        <>
          <Button onClick={replyByMail} tone="primary">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              メールで返信する
            </span>
          </Button>
          {status !== 'in_progress' && (
            <Button onClick={() => apply({ status: 'in_progress' })} disabled={isSaving}>
              対応中にする
            </Button>
          )}
          {status !== 'resolved' && (
            <Button onClick={() => apply({ status: 'resolved' })} disabled={isSaving}>
              対応済みにする
            </Button>
          )}
          {status === 'resolved' && (
            <Button onClick={() => apply({ status: 'open' })} disabled={isSaving}>
              未対応に戻す
            </Button>
          )}
        </>
      }
    >
      <Field label="受付日時"><Mono>{formatDateTime(inquiry.createdAt)}</Mono></Field>
      <Field label="連絡先">
        <div className="flex items-center gap-2 flex-wrap">
          <Mono className="break-all">{inquiry.email}</Mono>
          <button
            onClick={copyEmail}
            aria-label="メールアドレスをコピー"
            className="p-1 rounded hover:bg-canvas cursor-pointer"
          >
            {copied
              ? <Check className="w-3.5 h-3.5 text-success" />
              : <Copy className="w-3.5 h-3.5 text-ink-faint" />}
          </button>
        </div>
      </Field>
      <Field label="ユーザーID"><Mono className="text-ink-muted break-all">{inquiry.userId}</Mono></Field>
      {inquiry.handledAt && (
        <Field label="最終対応"><Mono>{formatDateTime(inquiry.handledAt)}</Mono></Field>
      )}

      <div className="mt-5">
        <SectionLabel>お問い合わせ内容</SectionLabel>
        <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap bg-canvas rounded-lg p-3.5">
          {inquiry.body}
        </p>
      </div>

      {inquiry.attachmentCount > 0 && (
        <div className="mt-5">
          <SectionLabel>スクリーンショット（{inquiry.attachmentCount}）</SectionLabel>
          {isLoadingAttachments ? (
            <div className="h-24 rounded-lg bg-canvas animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {attachments.map((src, index) => (
                <a
                  key={index}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="w-28 h-28 rounded-lg overflow-hidden border border-line block hover:opacity-80 transition-opacity"
                >
                  <img src={src} alt={`添付${index + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5">
        <SectionLabel>対応メモ（社内用）</SectionLabel>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 2000))}
          placeholder="対応内容や引き継ぎ事項を記録します。会員には表示されません。"
          className="w-full min-h-[110px] bg-canvas border border-line rounded-lg px-3 py-2.5 text-[13px] text-ink placeholder-ink-faint resize-y focus:outline-none focus:border-primary transition-colors"
        />
        <div className="flex justify-end mt-2">
          <Button
            onClick={() => apply({ adminNote: note })}
            disabled={isSaving || note === (inquiry.adminNote || '')}
          >
            メモを保存する
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
