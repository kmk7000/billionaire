// Proactive community moderation — the sweep that does not start from a report.
//
// Posts and comments are hidden here, never deleted. `status` is what every
// reader query filters on (`where('status', '==', 'published')`), so flipping
// it removes content from the feed while leaving it recoverable if the
// decision is appealed.

import React, { useMemo, useState } from 'react';
import { EyeOff, Eye, MessageSquare, FileText, Search } from 'lucide-react';
import { adminContentService } from '../../services/adminService';
import type { CommunityComment, CommunityPost } from '../../types/db';
import {
  Badge, Button, CONTENT_STATUS_META, EmptyState, FilterChips, Mono,
  Table, Td, Th, Tr, formatDateTime,
} from '../ui';

interface Props {
  posts: CommunityPost[];
  comments: CommunityComment[];
  onChanged: () => void;
}

const FILTERS = [
  { value: 'posts', label: '投稿' },
  { value: 'comments', label: 'コメント' },
  { value: 'hidden', label: '非表示中' },
];

export const ContentPanel: React.FC<Props> = ({ posts, comments, onChanged }) => {
  const [filter, setFilter] = useState('posts');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const hiddenCount = useMemo(
    () =>
      posts.filter((p) => p.status !== 'published').length +
      comments.filter((c) => c.status !== 'published').length,
    [posts, comments]
  );

  const term = search.trim().toLowerCase();
  const matches = (text: string) => !term || text.toLowerCase().includes(term);

  const visiblePosts = useMemo(
    () =>
      posts.filter((post) => {
        if (filter === 'comments') return false;
        if (filter === 'hidden' && post.status === 'published') return false;
        return matches(`${post.title || ''} ${post.body || ''} ${post.anonHandle || ''}`);
      }),
    [posts, filter, term]
  );

  const visibleComments = useMemo(
    () =>
      comments.filter((comment) => {
        if (filter === 'posts') return false;
        if (filter === 'hidden' && comment.status === 'published') return false;
        return matches(`${comment.body || ''} ${comment.anonHandle || ''}`);
      }),
    [comments, filter, term]
  );

  const togglePost = async (post: CommunityPost) => {
    setBusyId(post.id);
    try {
      await adminContentService.setPostStatus(
        post.id,
        post.status === 'published' ? 'hidden' : 'published'
      );
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const toggleComment = async (comment: CommunityComment) => {
    setBusyId(comment.id);
    try {
      await adminContentService.setCommentStatus(
        comment.id,
        comment.status === 'published' ? 'hidden' : 'published'
      );
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const isEmpty = visiblePosts.length === 0 && visibleComments.length === 0;

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <FilterChips
          options={FILTERS.map((f) => ({
            ...f,
            count:
              f.value === 'posts' ? posts.length
                : f.value === 'comments' ? comments.length
                  : hiddenCount,
          }))}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative ml-auto w-full sm:w-[320px]">
          <label className="sr-only" htmlFor="content-search">本文で絞り込む</label>
          <Search className="w-4 h-4 text-ink-faint absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="content-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="本文・投稿者名で絞り込む"
            className="w-full h-8 bg-surface border border-line rounded-md pl-8 pr-3 text-[12px] text-ink placeholder-ink-faint focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {isEmpty ? (
        <div className="border border-line rounded-lg bg-surface">
          <EmptyState
            title="該当するコンテンツはありません"
            hint="直近の投稿・コメントのみを読み込んでいます。絞り込み条件を変えてお試しください。"
          />
        </div>
      ) : (
        <Table
          head={
            <tr>
              <Th className="w-[100px]">状態</Th>
              <Th className="w-[150px]">投稿日時</Th>
              <Th className="w-[200px]">投稿者</Th>
              <Th>内容</Th>
              <Th className="w-[130px]">いいね/返信/閲覧</Th>
              <Th className="w-[130px]">操作</Th>
            </tr>
          }
        >
          {visiblePosts.map((post) => (
            <ContentRow
              key={post.id}
              icon={<FileText className="w-3.5 h-3.5 text-ink-faint shrink-0" />}
              status={post.status}
              title={post.title}
              body={post.body}
              author={post.anonHandle}
              authorLabel={post.authorLabel}
              createdAt={post.createdAt}
              meta={`${post.likeCount ?? 0} / ${post.commentCount ?? 0} / ${post.viewCount ?? 0}`}
              isBusy={busyId === post.id}
              onToggle={() => togglePost(post)}
            />
          ))}
          {visibleComments.map((comment) => (
            <ContentRow
              key={comment.id}
              icon={<MessageSquare className="w-3.5 h-3.5 text-ink-faint shrink-0" />}
              status={comment.status}
              body={comment.body}
              author={comment.anonHandle}
              authorLabel={comment.authorLabel}
              createdAt={comment.createdAt}
              meta={`${comment.likeCount ?? 0} / — / —`}
              isBusy={busyId === comment.id}
              onToggle={() => toggleComment(comment)}
            />
          ))}
        </Table>
      )}
    </div>
  );
};

const ContentRow: React.FC<{
  icon: React.ReactNode;
  status: string;
  title?: string;
  body: string;
  author: string;
  authorLabel: string;
  createdAt: any;
  meta: string;
  isBusy: boolean;
  onToggle: () => void;
}> = ({ icon, status, title, body, author, authorLabel, createdAt, meta, isBusy, onToggle }) => {
  const statusMeta = CONTENT_STATUS_META[status] || CONTENT_STATUS_META.published;
  const isPublished = status === 'published';
  return (
    <Tr>
      <Td>
        <span className="flex items-center gap-1.5">
          {icon}
          <Badge label={statusMeta.label} tone={statusMeta.tone} />
        </span>
      </Td>
      <Td><Mono className="text-ink-muted">{formatDateTime(createdAt)}</Mono></Td>
      <Td>
        <span className="block text-[12px] text-ink truncate">{author}</span>
        <span className="block text-[11px] text-ink-faint truncate">{authorLabel}</span>
      </Td>
      <Td>
        {title && <span className="block font-bold mb-0.5">{title}</span>}
        <span className="line-clamp-2 leading-relaxed text-ink-muted">{body}</span>
      </Td>
      <Td><Mono className="text-ink-faint whitespace-nowrap">{meta}</Mono></Td>
      <Td>
        <Button onClick={onToggle} tone={isPublished ? 'danger' : 'default'} disabled={isBusy}>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isPublished ? '非表示' : '公開に戻す'}
          </span>
        </Button>
      </Td>
    </Tr>
  );
};
