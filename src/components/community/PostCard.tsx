import React from 'react';
import { Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import type { CommunityPost } from '../../types/db';
import { getCommunityBoardLabel } from '../../constants/communityBoards';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

interface PostCardProps {
  post: CommunityPost;
  onSelect: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onSelect }) => (
  <div
    onClick={() => onSelect(post.id)}
    className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
  >
    <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
      {getCommunityBoardLabel(post.boardId)}
    </span>
    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{post.title}</h3>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.body}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="font-bold text-gray-700">{post.anonHandle}</span>
        <span>|</span>
        <span>{post.authorLabel}</span>
      </div>
      <span className="text-[10px] text-gray-400">{formatRelativeTime(post.createdAt)}</span>
    </div>
    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount ?? 0}</span>
      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likeCount}</span>
      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.commentCount}</span>
    </div>
  </div>
);
