// 通報 (content report) triage.
//
// The point of this panel is that a moderator never acts on an ID: opening a
// report fetches the post or comment it points at, so the judgement is made
// against the actual content. Acting hides the content and closes the report
// in one step.

import React, { useEffect, useMemo, useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import {
  adminContentService, adminReportService, type AdminReport, type ReportStatus,
} from '../../services/adminService';
import type { CommunityComment, CommunityPost } from '../../types/db';
import {
  Badge, Button, CONTENT_STATUS_META, Drawer, EmptyState, Field, FilterChips,
  Mono, REPORT_REASON_LABEL, REPORT_STATUS_META, REPORT_TARGET_LABEL,
  SLA_HOURS, SectionLabel, Table, Td, Th, Tr, formatDateTime, hoursSince,
} from '../ui';

interface Props {
  reports: AdminReport[];
  adminUid: string;
  onChanged: () => void;
}

const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'open', label: '未対応' },
  { value: 'reviewing', label: '確認中' },
  { value: 'actioned', label: '措置済み' },
  { value: 'dismissed', label: '却下' },
];

export const ReportsPanel: React.FC<Props> = ({ reports, adminUid, onChanged }) => {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: reports.length };
    reports.forEach((item) => {
      const status = item.status || 'open';
      map[status] = (map[status] || 0) + 1;
    });
    return map;
  }, [reports]);

  const visible = useMemo(
    () => (filter === 'all' ? reports : reports.filter((r) => (r.status || 'open') === filter)),
    [reports, filter]
  );

  const selected = reports.find((item) => item.id === selectedId) || null;

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <FilterChips
          options={FILTERS.map((f) => ({ ...f, count: counts[f.value] || 0 }))}
          value={filter}
          onChange={setFilter}
        />
        <span className="ml-auto font-mono text-[11px] text-ink-faint">
          {visible.length} / {reports.length} 件
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="border border-line rounded-lg bg-surface">
          <EmptyState
            title="該当する通報はありません"
            hint="コミュニティの投稿・コメントが通報されると、ここに表示されます。"
          />
        </div>
      ) : (
        <Table
          head={
            <tr>
              <Th className="w-[110px]">状態</Th>
              <Th className="w-[150px]">通報日時</Th>
              <Th className="w-[90px]">対象</Th>
              <Th className="w-[150px]">理由</Th>
              <Th>詳細</Th>
            </tr>
          }
        >
          {visible.map((item) => {
            const status = item.status || 'open';
            const meta = REPORT_STATUS_META[status] || REPORT_STATUS_META.open;
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
                <Td>
                  <Badge label={REPORT_TARGET_LABEL[item.targetType] || item.targetType} />
                </Td>
                <Td className="font-bold">{REPORT_REASON_LABEL[item.reason] || item.reason}</Td>
                <Td>
                  <span className="line-clamp-2 leading-relaxed text-ink-muted">
                    {item.detail || '—'}
                  </span>
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}

      {selected && (
        <ReportDrawer
          key={selected.id}
          report={selected}
          adminUid={adminUid}
          onClose={() => setSelectedId(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
};

type Target =
  | { kind: 'post'; post: CommunityPost }
  | { kind: 'comment'; comment: CommunityComment }
  | null;

const ReportDrawer: React.FC<{
  report: AdminReport;
  adminUid: string;
  onClose: () => void;
  onChanged: () => void;
}> = ({ report, adminUid, onClose, onChanged }) => {
  const [target, setTarget] = useState<Target>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(true);
  const [note, setNote] = useState(report.adminNote || '');
  const [isSaving, setIsSaving] = useState(false);

  const loadTarget = (onDone?: (t: Target) => void) => {
    setIsLoadingTarget(true);
    return adminReportService.loadTarget(report.targetType, report.targetId).then((result) => {
      setTarget(result);
      setIsLoadingTarget(false);
      onDone?.(result);
    });
  };

  // Logged once per drawer open — see the matching comment in InquiriesPanel.
  useEffect(() => {
    adminReportService.logView(report.id);
  }, [report.id]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingTarget(true);
    adminReportService.loadTarget(report.targetType, report.targetId).then((result) => {
      if (cancelled) return;
      setTarget(result);
      setIsLoadingTarget(false);
    });
    return () => { cancelled = true; };
  }, [report.targetType, report.targetId]);

  const apply = async (patch: { status?: ReportStatus; adminNote?: string }) => {
    setIsSaving(true);
    try {
      await adminReportService.update(report.id, adminUid, patch);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  /** Hides the reported content, then closes the report as actioned. */
  const hideAndAction = async () => {
    if (!target) return;
    setIsSaving(true);
    try {
      if (target.kind === 'post') {
        await adminContentService.setPostStatus(target.post.id, 'hidden');
      } else {
        await adminContentService.setCommentStatus(target.comment.id, 'hidden');
      }
      await adminReportService.update(report.id, adminUid, { status: 'actioned' });
      await loadTarget();
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const restore = async () => {
    if (!target) return;
    setIsSaving(true);
    try {
      if (target.kind === 'post') {
        await adminContentService.setPostStatus(target.post.id, 'published');
      } else {
        await adminContentService.setCommentStatus(target.comment.id, 'published');
      }
      await loadTarget();
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const status = (report.status || 'open') as ReportStatus;
  const meta = REPORT_STATUS_META[status];
  const targetStatus = target
    ? target.kind === 'post' ? target.post.status : target.comment.status
    : null;
  const isHidden = targetStatus === 'hidden' || targetStatus === 'deleted';

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={
        <>
          <Badge label={meta.label} tone={meta.tone} />
          <Mono className="text-ink-faint truncate">{report.id}</Mono>
        </>
      }
      footer={
        <>
          {target && !isHidden && (
            <Button onClick={hideAndAction} tone="danger" disabled={isSaving}>
              <span className="flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                非表示にして措置済み
              </span>
            </Button>
          )}
          {target && isHidden && (
            <Button onClick={restore} disabled={isSaving}>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                公開に戻す
              </span>
            </Button>
          )}
          {status !== 'reviewing' && (
            <Button onClick={() => apply({ status: 'reviewing' })} disabled={isSaving}>
              確認中にする
            </Button>
          )}
          {status !== 'dismissed' && (
            <Button onClick={() => apply({ status: 'dismissed' })} disabled={isSaving}>
              却下する
            </Button>
          )}
          {status !== 'open' && (
            <Button onClick={() => apply({ status: 'open' })} disabled={isSaving}>
              未対応に戻す
            </Button>
          )}
        </>
      }
    >
      <Field label="通報日時"><Mono>{formatDateTime(report.createdAt)}</Mono></Field>
      <Field label="対象">
        {REPORT_TARGET_LABEL[report.targetType] || report.targetType}
        <Mono className="text-ink-faint ml-2 break-all">{report.targetId}</Mono>
      </Field>
      <Field label="理由">{REPORT_REASON_LABEL[report.reason] || report.reason}</Field>
      {report.detail && <Field label="詳細">{report.detail}</Field>}
      <Field label="通報者"><Mono className="text-ink-muted break-all">{report.reporterId}</Mono></Field>

      <div className="mt-5">
        <SectionLabel>通報された内容</SectionLabel>
        {isLoadingTarget ? (
          <div className="h-24 rounded-lg bg-canvas animate-pulse" />
        ) : !target ? (
          <p className="text-[13px] text-ink-muted bg-canvas rounded-lg p-3.5 leading-relaxed">
            {report.targetType === 'post' || report.targetType === 'comment'
              ? '対象のコンテンツが見つかりません。すでに削除された可能性があります。'
              : `${REPORT_TARGET_LABEL[report.targetType] || report.targetType}への通報は内容のプレビューに対応していません。対象IDを控えて個別にご確認ください。`}
          </p>
        ) : (
          <div className="bg-canvas rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {targetStatus && (
                <Badge
                  label={CONTENT_STATUS_META[targetStatus]?.label || targetStatus}
                  tone={CONTENT_STATUS_META[targetStatus]?.tone}
                />
              )}
              <span className="text-[11px] text-ink-faint">
                {target.kind === 'post' ? target.post.anonHandle : target.comment.anonHandle}
                {' ・ '}
                {target.kind === 'post' ? target.post.authorLabel : target.comment.authorLabel}
              </span>
            </div>
            {target.kind === 'post' && (
              <p className="text-[14px] font-bold text-ink mb-1">{target.post.title}</p>
            )}
            <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">
              {target.kind === 'post' ? target.post.body : target.comment.body}
            </p>
            <Mono className="text-ink-faint mt-2 block">
              投稿日時 {formatDateTime(target.kind === 'post' ? target.post.createdAt : target.comment.createdAt)}
            </Mono>
          </div>
        )}
      </div>

      <div className="mt-5">
        <SectionLabel>対応メモ（社内用）</SectionLabel>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 2000))}
          placeholder="判断の根拠を記録します。同じ利用者が繰り返し通報された場合の判断材料になります。"
          className="w-full min-h-[110px] bg-canvas border border-line rounded-lg px-3 py-2.5 text-[13px] text-ink placeholder-ink-faint resize-y focus:outline-none focus:border-primary transition-colors"
        />
        <div className="flex justify-end mt-2">
          <Button
            onClick={() => apply({ adminNote: note })}
            disabled={isSaving || note === (report.adminNote || '')}
          >
            メモを保存する
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
