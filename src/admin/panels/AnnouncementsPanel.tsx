// お知らせ authoring.
//
// Publishing is a two-state affair rather than a delete-and-recreate: a draft
// can be written and reviewed before anyone sees it, and a live announcement
// can be pulled back without losing its text. `publishedAt` is stamped only on
// the first publish, so fixing a typo later does not shove the item back to
// the top of every member's list.

import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { adminAnnouncementService, type Announcement } from '../../services/announcementService';
import {
  Badge, Button, EmptyState, FilterChips, Mono,
  Table, Td, Th, Tr, formatDateTime,
} from '../ui';

interface Props {
  announcements: Announcement[];
  adminUid: string;
  onChanged: () => void;
}

const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'published', label: '公開中' },
  { value: 'draft', label: '下書き' },
];

const MAX_TITLE = 80;
const MAX_BODY = 4000;

export const AnnouncementsPanel: React.FC<Props> = ({ announcements, adminUid, onChanged }) => {
  const [filter, setFilter] = useState('all');
  const [isComposing, setIsComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: announcements.length,
    published: announcements.filter((a) => a.isPublished).length,
    draft: announcements.filter((a) => !a.isPublished).length,
  }), [announcements]);

  const visible = useMemo(() => announcements.filter((a) => {
    if (filter === 'published') return a.isPublished;
    if (filter === 'draft') return !a.isPublished;
    return true;
  }), [announcements, filter]);

  const resetForm = () => {
    setIsComposing(false);
    setEditingId(null);
    setTitle('');
    setBody('');
  };

  const startEdit = (item: Announcement) => {
    setEditingId(item.id);
    setIsComposing(true);
    setTitle(item.title);
    setBody(item.body);
  };

  const save = async (publish: boolean) => {
    if (!title.trim() || !body.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        const existing = announcements.find((a) => a.id === editingId);
        await adminAnnouncementService.update(editingId, {
          title: title.trim(),
          body: body.trim(),
          isPublished: publish,
          // First publish only.
          setPublishedAt: publish && !existing?.publishedAt,
        });
      } else {
        await adminAnnouncementService.create(adminUid, {
          title: title.trim(),
          body: body.trim(),
          publish,
        });
      }
      resetForm();
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (item: Announcement) => {
    setIsSaving(true);
    try {
      await adminAnnouncementService.update(item.id, {
        isPublished: !item.isPublished,
        setPublishedAt: !item.isPublished && !item.publishedAt,
      });
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    setIsSaving(true);
    try {
      await adminAnnouncementService.remove(id);
      setPendingDeleteId(null);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = title.trim().length > 0 && body.trim().length > 0 && !isSaving;

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <FilterChips
          options={FILTERS.map((f) => ({ ...f, count: (counts as any)[f.value] }))}
          value={filter}
          onChange={setFilter}
        />
        {!isComposing && (
          <div className="ml-auto">
            <Button onClick={() => { resetForm(); setIsComposing(true); }} tone="primary">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                新規作成
              </span>
            </Button>
          </div>
        )}
      </div>

      {isComposing && (
        <div className="border border-line rounded-lg bg-surface p-4 mb-4">
          <h2 className="text-[13px] font-bold text-ink mb-3">
            {editingId ? 'お知らせを編集' : '新しいお知らせ'}
          </h2>

          <label htmlFor="ann-title" className="block text-[12px] font-bold text-ink mb-1.5">
            タイトル
          </label>
          <input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
            placeholder="メンテナンスのお知らせ"
            className="w-full h-9 bg-canvas border border-line rounded-md px-3 text-[13px] text-ink placeholder-ink-faint focus:outline-none focus:border-primary transition-colors"
          />

          <label htmlFor="ann-body" className="block text-[12px] font-bold text-ink mt-3 mb-1.5">
            本文
          </label>
          <textarea
            id="ann-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            placeholder="改行はそのまま会員に表示されます。"
            className="w-full min-h-[140px] bg-canvas border border-line rounded-md px-3 py-2.5 text-[13px] text-ink placeholder-ink-faint resize-y focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-right text-[11px] text-ink-faint mt-1 font-mono">
            {body.length} / {MAX_BODY}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={() => save(true)} tone="primary" disabled={!canSave}>
              公開する
            </Button>
            <Button onClick={() => save(false)} disabled={!canSave}>
              下書きとして保存
            </Button>
            <Button onClick={resetForm} disabled={isSaving}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="border border-line rounded-lg bg-surface">
          <EmptyState
            title="お知らせはありません"
            hint="「新規作成」から会員向けのお知らせを書けます。公開するまで会員には表示されません。"
          />
        </div>
      ) : (
        <Table
          head={
            <tr>
              <Th className="w-[100px]">状態</Th>
              <Th className="w-[150px]">公開日時</Th>
              <Th>タイトル / 本文</Th>
              <Th className="w-[230px]">操作</Th>
            </tr>
          }
        >
          {visible.map((item) => (
            <Tr key={item.id}>
              <Td>
                <Badge
                  label={item.isPublished ? '公開中' : '下書き'}
                  tone={item.isPublished ? 'done' : 'neutral'}
                />
              </Td>
              <Td>
                <Mono className="text-ink-muted">
                  {item.publishedAt ? formatDateTime(item.publishedAt) : '—'}
                </Mono>
              </Td>
              <Td>
                <span className="block font-bold mb-0.5">{item.title}</span>
                <span className="line-clamp-2 leading-relaxed text-ink-muted">{item.body}</span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  <Button onClick={() => startEdit(item)} disabled={isSaving}>編集</Button>
                  <Button
                    onClick={() => togglePublish(item)}
                    tone={item.isPublished ? 'danger' : 'default'}
                    disabled={isSaving}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      {item.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {item.isPublished ? '非公開' : '公開'}
                    </span>
                  </Button>
                  {pendingDeleteId === item.id ? (
                    <>
                      <Button onClick={() => remove(item.id)} tone="danger" disabled={isSaving}>
                        本当に削除
                      </Button>
                      <Button onClick={() => setPendingDeleteId(null)}>戻る</Button>
                    </>
                  ) : (
                    <Button onClick={() => setPendingDeleteId(item.id)} tone="danger" disabled={isSaving}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
};
