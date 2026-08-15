// Dashboard: what needs attention now, then the totals.
//
// Queue numbers come from the lists already in memory; collection totals come
// from Firestore's server-side aggregation (one billed read per 1,000 docs)
// rather than downloading the collections to count them.

import React from 'react';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import type { AdminInquiry, AdminReport, AdminStats } from '../../services/adminService';
import type { CommunityPost } from '../../types/db';
import type { PanelKey } from '../AdminApp';
import { Badge, Mono, SectionLabel, SLA_HOURS, formatDateTime, hoursSince } from '../ui';

interface Props {
  stats: AdminStats | null;
  inquiries: AdminInquiry[];
  reports: AdminReport[];
  posts: CommunityPost[];
  onNavigate: (panel: PanelKey) => void;
}

export const OverviewPanel: React.FC<Props> = ({ stats, inquiries, reports, posts, onNavigate }) => {
  const openInquiries = inquiries.filter((item) => (item.status || 'open') === 'open');
  const openReports = reports.filter((item) => (item.status || 'open') === 'open');
  const hiddenPosts = posts.filter((post) => post.status !== 'published');

  const overdue = [
    ...openInquiries.map((item) => ({
      kind: 'inquiry' as const, id: item.id, label: item.body, createdAt: item.createdAt,
    })),
    ...openReports.map((item) => ({
      kind: 'report' as const, id: item.id, label: item.detail || item.reason, createdAt: item.createdAt,
    })),
  ]
    .map((item) => ({ ...item, age: hoursSince(item.createdAt) }))
    .filter((item) => item.age !== null && item.age >= SLA_HOURS)
    .sort((a, b) => (b.age || 0) - (a.age || 0));

  const postsLast7Days = posts.filter((post) => {
    const age = hoursSince(post.createdAt);
    return age !== null && age <= 24 * 7;
  }).length;

  return (
    <div className="max-w-[1200px] space-y-6">
      <section>
        <SectionLabel>対応が必要なもの</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QueueTile
            label="未対応のお問い合わせ"
            value={openInquiries.length}
            onClick={() => onNavigate('inquiries')}
          />
          <QueueTile
            label="未対応の通報"
            value={openReports.length}
            onClick={() => onNavigate('reports')}
          />
        </div>
      </section>

      {overdue.length > 0 && (
        <section className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TriangleAlert className="w-4 h-4 text-accent shrink-0" />
            <h2 className="text-[13px] font-bold text-accent">
              {SLA_HOURS}時間を超えて未対応の案件が{overdue.length}件あります
            </h2>
          </div>
          <ul className="space-y-1">
            {overdue.slice(0, 8).map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  onClick={() => onNavigate(item.kind === 'inquiry' ? 'inquiries' : 'reports')}
                  className="w-full text-left flex items-center gap-2.5 py-1 cursor-pointer group"
                >
                  <Badge label={item.kind === 'inquiry' ? 'お問い合わせ' : '通報'} tone="danger" />
                  <span className="text-[13px] text-ink truncate flex-1 group-hover:underline">
                    {item.label}
                  </span>
                  <Mono className="text-ink-muted shrink-0">{item.age}h</Mono>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionLabel>サービスの規模</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile label="ユーザー" value={stats?.users} onClick={() => onNavigate('users')} />
          <StatTile label="投稿" value={stats?.posts} onClick={() => onNavigate('content')} />
          <StatTile label="コメント" value={stats?.comments} onClick={() => onNavigate('content')} />
          <StatTile label="お問い合わせ累計" value={stats?.inquiries} onClick={() => onNavigate('inquiries')} />
          <StatTile label="通報累計" value={stats?.reports} onClick={() => onNavigate('reports')} />
          <StatTile label="直近7日の投稿" value={postsLast7Days} onClick={() => onNavigate('content')} />
        </div>
        <p className="text-[12px] text-ink-muted mt-2 leading-relaxed">
          「直近7日の投稿」は読み込み済みの最新{posts.length}件からの集計です。現在
          {hiddenPosts.length}件を非表示にしています。
        </p>
      </section>

      <section>
        <SectionLabel>最近のお問い合わせ</SectionLabel>
        {inquiries.length === 0 ? (
          <p className="text-[13px] text-ink-muted py-3">まだお問い合わせはありません。</p>
        ) : (
          <ul className="border border-line rounded-lg bg-surface overflow-hidden">
            {inquiries.slice(0, 6).map((item) => (
              <li key={item.id} className="border-b border-line last:border-b-0">
                <button
                  onClick={() => onNavigate('inquiries')}
                  className="w-full text-left px-3 py-2.5 hover:bg-canvas transition-colors cursor-pointer flex items-center gap-3"
                >
                  <span className="text-[13px] text-ink truncate flex-1">{item.body}</span>
                  <Mono className="text-ink-faint shrink-0">{formatDateTime(item.createdAt)}</Mono>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const QueueTile: React.FC<{ label: string; value: number; onClick: () => void }> = ({
  label, value, onClick,
}) => {
  const isAlert = value > 0;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-4 transition-colors cursor-pointer ${
        isAlert ? 'border-accent/30 bg-accent/5 hover:bg-accent/10' : 'border-line bg-surface hover:bg-canvas'
      }`}
    >
      <p className="text-[12px] text-ink-muted mb-1.5">{label}</p>
      <div className="flex items-end gap-1.5">
        <span
          className={`font-mono text-[32px] leading-none font-bold ${isAlert ? 'text-accent' : 'text-ink'}`}
        >
          {value}
        </span>
        <span className="text-[11px] text-ink-faint mb-1">件</span>
        <ArrowRight className="w-4 h-4 text-ink-faint ml-auto mb-1" />
      </div>
    </button>
  );
};

const StatTile: React.FC<{ label: string; value?: number; onClick: () => void }> = ({
  label, value, onClick,
}) => (
  <button
    onClick={onClick}
    className="text-left rounded-lg border border-line bg-surface p-3 hover:bg-canvas transition-colors cursor-pointer"
  >
    <p className="text-[11px] text-ink-muted mb-1 truncate">{label}</p>
    {/* -1 marks a count query that failed; a dash beats a wrong number. */}
    <span className="font-mono text-[20px] leading-none font-bold text-ink">
      {value === undefined ? '…' : value < 0 ? '—' : value.toLocaleString('ja-JP')}
    </span>
  </button>
);
