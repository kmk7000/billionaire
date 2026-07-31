import React from 'react';
import { User } from 'lucide-react';
import { motion } from 'motion/react';
import type { Post } from '../types/app';
import { ForumPost } from '../components/community/ForumPost';

export const CommunityScreen: React.FC<{ posts: Post[] }> = ({ posts }) => (
  <motion.div
    key="forum"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <div className="bg-white p-4 mb-2 flex items-center gap-3 border-b border-gray-100">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm text-gray-400">
        今の気持ちを投稿してみましょう
      </div>
    </div>
    {posts.map(p => (
      <ForumPost key={p.id} post={p} />
    ))}
  </motion.div>
);
