import React from 'react';
import { MessageSquare, TrendingUp } from 'lucide-react';
import type { Post } from '../../types/app';

export const ForumPost: React.FC<{ post: Post }> = ({ post }) => (
  <div className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{post.category}</span>
      <span className="text-[10px] text-gray-400">{post.authorCompany} • {post.createdAt}</span>
    </div>
    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{post.title}</h3>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>
    <div className="flex items-center gap-4 text-xs text-gray-400">
      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {post.likes}</span>
      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments}</span>
    </div>
  </div>
);
