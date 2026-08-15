// Read-only trail of every admin view and action.
//
// This panel is the whole point of the audit log: it exists so any operator
// can answer "who looked at this" and "who changed that" without asking
// around. The log itself is append-only (see firestore.rules) — nothing here
// can edit or delete an entry, including the operator's own.

import React, { useMemo, useState } from 'react';
import { Eye, Pencil, EyeOff, RotateCcw } from 'lucide-react';
import type { AdminAuditEntry } from '../../services/adminService';
import {
  AUDIT_ACTION_META, AUDIT_TARGET_LABEL, Badge, EmptyState, FilterChips,
  Mono, Table, Td, Th, Tr, formatDateTime,
} from '../ui';

interface Props {
  entries: AdminAuditEntry[];
}

const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'view', label: '閲覧' },
  { value: 'change', label: '変更・措置' },
];

const ACTION_ICON: Record<string, any> = {
  inquiry_view: Eye,
  report_view: Eye,
  inquiry_status: Pencil,
  report_status: Pencil,
  inquiry_note: Pencil,
  report_note: Pencil,
  post_hide: EyeOff,
  comment_hide: EyeOff,
  post_restore: RotateCcw,
  comment_restore: RotateCcw,
};

export const AuditLogPanel: React.FC<Props> = ({ entries }) => {
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: entries.length, view: 0, change: 0 };
    entries.forEach((entry) => {
      if (entry.action.endsWith('_view')) map.view += 1;
      else map.change += 1;
    });
    return map;
  }, [entries]);

  const visible = useMemo(
    () =>
      entries.filter((entry) => {
        if (filter === 'view') return entry.action.endsWith('_view');
        if (filter === 'change') return !entry.action.endsWith('_view');
        return true;
      }),
    [entries, filter]
  );

  return (
    <div className="max-w-[1400px]">
      <p className="text-[12px] text-ink-muted mb-3 leading-relaxed max-w-2xl">
        お問い合わせ・通報の閲覧、状態変更、コンテンツの非表示化・復元をすべて記録しています。
        このログ自体は編集・削除できません。
      </p>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <FilterChips
          options={FILTERS.map((f) => ({ ...f, count: counts[f.value] || 0 }))}
          value={filter}
          onChange={setFilter}
        />
        <span className="ml-auto font-mono text-[11px] text-ink-faint">
          直近{entries.length}件を表示
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="border border-line rounded-lg bg-surface">
          <EmptyState title="記録はまだありません" hint="運営操作を行うと、ここに記録されます。" />
        </div>
      ) : (
        <Table
          head={
            <tr>
              <Th className="w-[150px]">日時</Th>
              <Th className="w-[220px]">運営者</Th>
              <Th className="w-[140px]">操作</Th>
              <Th className="w-[110px]">対象</Th>
              <Th>対象ID / 詳細</Th>
            </tr>
          }
        >
          {visible.map((entry) => {
            const meta = AUDIT_ACTION_META[entry.action] || { label: entry.action, tone: 'neutral' as const };
            const Icon = ACTION_ICON[entry.action] || Eye;
            return (
              <Tr key={entry.id}>
                <Td><Mono className="text-ink-muted">{formatDateTime(entry.createdAt)}</Mono></Td>
                <Td><Mono className="break-all">{entry.adminEmail || entry.adminUid}</Mono></Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                    <Badge label={meta.label} tone={meta.tone} />
                  </span>
                </Td>
                <Td>{AUDIT_TARGET_LABEL[entry.targetType] || entry.targetType}</Td>
                <Td>
                  <Mono className="text-ink-muted break-all">{entry.targetId}</Mono>
                  {entry.detail && <span className="block text-[12px] text-ink-muted mt-0.5">{entry.detail}</span>}
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </div>
  );
};
