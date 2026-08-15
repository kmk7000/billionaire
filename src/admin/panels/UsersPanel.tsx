// Account lookup for support.
//
// Scope is deliberately narrow: the newest accounts plus an exact-email
// lookup. It is not an export tool, and it never reaches into a member's saved
// cards — `meishi` documents describe third parties who handed over a card and
// never agreed to the operator browsing them. The rules would permit that read;
// the product should not make it a screen.
//
// Role is read-only here by design. `firestore.rules` requires
// `data.uid == request.auth.uid` on every users write, so nobody — admin
// included — can edit another account's document from a client. Granting the
// operator role is a Firebase Console action, which is the right amount of
// friction for the one permission that unlocks this entire site.

import React, { useState } from 'react';
import { Search, ShieldCheck, X } from 'lucide-react';
import { adminUserService, type AdminUserRow } from '../../services/adminService';
import {
  Badge, Button, EmptyState, Field, Mono, SectionLabel, Table, Td, Th, Tr, formatDateTime,
} from '../ui';

interface Props {
  users: AdminUserRow[];
}

export const UsersPanel: React.FC<Props> = ({ users }) => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<AdminUserRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const runSearch = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setNotFound(false);
    setResult(null);
    try {
      const found = await adminUserService.findByEmail(trimmed);
      setResult(found);
      setNotFound(!found);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setEmail('');
    setResult(null);
    setNotFound(false);
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      <section>
        <SectionLabel>メールアドレスで検索</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          <div className="relative w-full sm:w-[360px]">
            <label htmlFor="user-email" className="sr-only">メールアドレス</label>
            <Search className="w-4 h-4 text-ink-faint absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="user-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              placeholder="user@example.com"
              className="w-full h-9 bg-surface border border-line rounded-md pl-8 pr-8 text-[13px] text-ink placeholder-ink-faint focus:outline-none focus:border-primary transition-colors"
            />
            {email && (
              <button
                aria-label="検索条件をクリア"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-ink-faint" />
              </button>
            )}
          </div>
          <Button onClick={runSearch} tone="primary" disabled={isSearching || !email.trim()}>
            検索する
          </Button>
        </div>
        <p className="text-[12px] text-ink-muted mt-1.5 leading-relaxed">
          完全一致のみ検索できます。部分一致はFirestoreの仕様上サポートしていません。
        </p>

        {notFound && (
          <p className="text-[13px] text-ink-muted mt-3">該当するアカウントは見つかりませんでした。</p>
        )}

        {result && (
          <div className="mt-3 max-w-[560px] border border-line rounded-lg bg-surface px-3.5 py-1">
            <Field label="表示名">{result.displayName || '（未設定）'}</Field>
            <Field label="メール"><Mono className="break-all">{result.email}</Mono></Field>
            <Field label="UID"><Mono className="text-ink-muted break-all">{result.uid}</Mono></Field>
            <Field label="会社">{result.company || '—'}</Field>
            <Field label="役職">{result.position || '—'}</Field>
            <Field label="権限">
              {result.role === 'admin'
                ? <Badge label="管理者" tone="done" />
                : <Badge label="一般ユーザー" />}
            </Field>
            <Field label="登録日時"><Mono>{formatDateTime(result.createdAt)}</Mono></Field>
          </div>
        )}
      </section>

      <section>
        <SectionLabel>最近登録したアカウント（{users.length}）</SectionLabel>
        {users.length === 0 ? (
          <div className="border border-line rounded-lg bg-surface">
            <EmptyState title="アカウントがありません" />
          </div>
        ) : (
          <Table
            head={
              <tr>
                <Th className="w-[200px]">表示名</Th>
                <Th className="w-[260px]">メール</Th>
                <Th>会社 ・ 役職</Th>
                <Th className="w-[120px]">権限</Th>
                <Th className="w-[150px]">登録日時</Th>
              </tr>
            }
          >
            {users.map((user) => (
              <Tr key={user.uid}>
                <Td className="font-bold truncate">{user.displayName || '（表示名なし）'}</Td>
                <Td><Mono className="text-ink-muted break-all">{user.email}</Mono></Td>
                <Td className="text-ink-muted">
                  {[user.company, user.position].filter(Boolean).join(' ・ ') || '—'}
                </Td>
                <Td>
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-success" />
                      <Badge label="管理者" tone="done" />
                    </span>
                  ) : (
                    <Badge label="一般" />
                  )}
                </Td>
                <Td><Mono className="text-ink-muted">{formatDateTime(user.createdAt)}</Mono></Td>
              </Tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
};
