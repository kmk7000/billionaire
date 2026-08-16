// Operator console shell: auth gate, role gate, navigation, data loading.
//
// Two gates, and they are not the same thing. The role check below decides
// what this page draws; `isAdmin()` in firestore.rules decides what the
// database hands over. Deleting the client gate would change nothing about
// what a member can read — it exists so an operator whose role was never set
// gets an explanation instead of a wall of permission errors.

import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  LayoutDashboard, Inbox, Flag, MessagesSquare, Users, History, Megaphone,
  RefreshCw, LogOut, ShieldAlert, Loader2,
} from 'lucide-react';
import { auth, db } from '../firebase';
import type { CommunityComment, CommunityPost } from '../types/db';
import {
  adminAuditService, adminContentService, adminInquiryService, adminReportService,
  adminUserService, fetchAdminStats,
  type AdminAuditEntry, type AdminInquiry, type AdminReport, type AdminStats, type AdminUserRow,
} from '../services/adminService';
import { AdminLogin } from './AdminLogin';
import { OverviewPanel } from './panels/OverviewPanel';
import { InquiriesPanel } from './panels/InquiriesPanel';
import { ReportsPanel } from './panels/ReportsPanel';
import { ContentPanel } from './panels/ContentPanel';
import { UsersPanel } from './panels/UsersPanel';
import { AuditLogPanel } from './panels/AuditLogPanel';
import { AnnouncementsPanel } from './panels/AnnouncementsPanel';
import { adminAnnouncementService, type Announcement } from '../services/announcementService';
import { Button, ErrorState, LoadingState, SLA_HOURS, hoursSince } from './ui';

export type PanelKey = 'overview' | 'inquiries' | 'reports' | 'content' | 'users' | 'announcements' | 'audit';

const NAV: { key: PanelKey; label: string; Icon: any }[] = [
  { key: 'overview', label: '概要', Icon: LayoutDashboard },
  { key: 'inquiries', label: 'お問い合わせ', Icon: Inbox },
  { key: 'reports', label: '通報', Icon: Flag },
  { key: 'content', label: 'コミュニティ', Icon: MessagesSquare },
  { key: 'users', label: 'ユーザー', Icon: Users },
  { key: 'announcements', label: 'お知らせ', Icon: Megaphone },
  { key: 'audit', label: '監査ログ', Icon: History },
];

const PANEL_TITLE: Record<PanelKey, string> = {
  overview: '概要',
  inquiries: 'お問い合わせ',
  reports: '通報',
  content: 'コミュニティ管理',
  users: 'ユーザー',
  announcements: 'お知らせ',
  audit: '監査ログ',
};

export const AdminApp: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [panel, setPanel] = useState<PanelKey>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // The role lives on the user document; there is no custom claim yet, so it
  // is read once per sign-in rather than taken from the ID token.
  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setIsAuthReady(true);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', nextUser.uid));
        setRole(snap.exists() ? (snap.data() as any).role || 'user' : 'user');
      } catch {
        // A denied read means the rules do not consider this account an admin.
        setRole('user');
      }
      setIsAuthReady(true);
    });
  }, []);

  const isAdmin = role === 'admin';

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      // Loaded in one shot: the overview needs queue counts from every
      // collection anyway, and support volumes are small.
      const [nextInquiries, nextReports, nextPosts, nextComments, nextUsers, nextStats, nextAudit, nextAnnouncements] =
        await Promise.all([
          adminInquiryService.list(),
          adminReportService.list(),
          adminContentService.listPosts(),
          adminContentService.listComments(),
          adminUserService.listRecent(),
          fetchAdminStats(),
          adminAuditService.list(),
          adminAnnouncementService.list(),
        ]);
      setInquiries(nextInquiries);
      setReports(nextReports);
      setPosts(nextPosts);
      setComments(nextComments);
      setUsers(nextUsers);
      setStats(nextStats);
      setAuditLog(nextAudit);
      setAnnouncements(nextAnnouncements);
      setLoadedAt(new Date());
    } catch (err: any) {
      // `handleFirestoreError` in src/firebase.ts rethrows a plain Error whose
      // message is a JSON blob, so the FirebaseError `code` never survives —
      // the message text is the only reliable signal.
      const raw = `${err?.code || ''} ${err?.message || ''}`;
      const isDenied = raw.includes('permission-denied') || raw.includes('insufficient permissions');
      setError(
        isDenied
          ? 'データの読み取りが拒否されました。\nこのアカウントに管理者権限が付与されているかご確認ください。'
          : 'データの読み込みに失敗しました。通信状況をご確認のうえ、再度お試しください。'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAuthReady) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
      </main>
    );
  }

  if (!user) return <AdminLogin />;
  if (!isAdmin) return <NotAuthorized email={user.email} onSignOut={() => signOut(auth)} />;

  const openInquiries = inquiries.filter((item) => (item.status || 'open') === 'open').length;
  const openReports = reports.filter((item) => (item.status || 'open') === 'open').length;
  const overdue =
    inquiries.filter(
      (item) => (item.status || 'open') === 'open' && (hoursSince(item.createdAt) || 0) >= SLA_HOURS
    ).length +
    reports.filter(
      (item) => (item.status || 'open') === 'open' && (hoursSince(item.createdAt) || 0) >= SLA_HOURS
    ).length;

  const badgeFor = (key: PanelKey) =>
    key === 'inquiries' ? openInquiries : key === 'reports' ? openReports : 0;

  return (
    <div className="min-h-dvh flex bg-canvas">
      {/* Sidebar. Dark by design: operator tooling should never be mistaken
          for the member-facing app at a glance. */}
      <nav
        aria-label="管理メニュー"
        className="w-[220px] shrink-0 bg-ink flex flex-col sticky top-0 h-dvh"
      >
        <div className="px-4 h-14 flex items-center border-b border-white/10 shrink-0">
          <span className="text-white font-bold text-[15px] tracking-tight">Billionaire</span>
          <span className="ml-2 text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Admin
          </span>
        </div>

        <ul className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, Icon }) => {
            const isActive = key === panel;
            const badge = badgeFor(key);
            return (
              <li key={key}>
                <button
                  onClick={() => setPanel(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 h-9 px-2.5 rounded-md text-[13px] font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    isActive ? 'bg-surface/15 text-white' : 'text-white/60 hover:text-white hover:bg-surface/8'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  {badge > 0 && (
                    <span className="ml-auto font-mono text-[11px] px-1.5 py-0.5 rounded bg-accent text-white">
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="p-3 border-t border-white/10 shrink-0">
          <p className="text-[11px] text-white/50 truncate mb-2" title={user.email || ''}>
            {user.email}
          </p>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[12px] font-bold text-white/60 hover:text-white hover:bg-surface/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            ログアウト
          </button>
        </div>
      </nav>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-surface border-b border-line h-14 flex items-center gap-3 px-5 shrink-0">
          <h1 className="text-[16px] font-bold text-ink">{PANEL_TITLE[panel]}</h1>
          {overdue > 0 && (
            <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
              {SLA_HOURS}時間超過 {overdue}件
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {loadedAt && (
              <span className="font-mono text-[11px] text-ink-faint">
                最終取得 {loadedAt.toLocaleTimeString('ja-JP')}
              </span>
            )}
            <Button onClick={load} disabled={isLoading}>
              <span className="flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                更新
              </span>
            </Button>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-5">
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : isLoading && !loadedAt ? (
            <LoadingState />
          ) : (
            <>
              {panel === 'overview' && (
                <OverviewPanel
                  stats={stats}
                  inquiries={inquiries}
                  reports={reports}
                  posts={posts}
                  onNavigate={setPanel}
                />
              )}
              {panel === 'inquiries' && (
                <InquiriesPanel inquiries={inquiries} adminUid={user.uid} onChanged={load} />
              )}
              {panel === 'reports' && (
                <ReportsPanel reports={reports} adminUid={user.uid} onChanged={load} />
              )}
              {panel === 'content' && (
                <ContentPanel posts={posts} comments={comments} onChanged={load} />
              )}
              {panel === 'users' && <UsersPanel users={users} />}
              {panel === 'announcements' && (
                <AnnouncementsPanel announcements={announcements} adminUid={user.uid} onChanged={load} />
              )}
              {panel === 'audit' && <AuditLogPanel entries={auditLog} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

/**
 * Shown to a signed-in account without the operator role. It names the exact
 * grant that is missing, because anyone who gets this far is an operator whose
 * role was never set — a member has no link to this page at all.
 */
const NotAuthorized: React.FC<{ email: string | null; onSignOut: () => void }> = ({
  email, onSignOut,
}) => (
  <main className="min-h-dvh flex items-center justify-center bg-canvas px-6">
    <div className="max-w-md text-center flex flex-col items-center gap-3">
      <ShieldAlert className="w-10 h-10 text-ink-faint" />
      <h1 className="text-[18px] font-bold text-ink">このアカウントには権限がありません</h1>
      <p className="text-[13px] text-ink-muted leading-relaxed">
        <span className="font-mono text-[12px] text-ink">{email}</span>{' '}
        は運営者として登録されていません。Firebase コンソールで
        <span className="font-bold text-ink">
          「users」コレクション内の該当ドキュメントの「role」を「admin」
        </span>
        に変更してください。
      </p>
      <p className="text-[12px] text-ink-faint leading-relaxed">
        セキュリティルール上、この権限をアプリから自分に付与することはできません。
      </p>
      <div className="mt-2">
        <Button onClick={onSignOut}>別のアカウントでログイン</Button>
      </div>
    </div>
  </main>
);
