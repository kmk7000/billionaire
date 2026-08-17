import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { AnnouncementList } from './AnnouncementList';
import { useSwipeBack } from '../hooks/useSwipeBack';

interface NotificationsPanelProps {
  onClose: () => void;
}

// Shows operator announcements written in the admin console. Personal push
// notifications (community replies, likes) still need a sender — see
// CLAUDE.md item 8 — so nothing here fakes a badge count.
export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
  // Left-edge swipe closes, same as the back arrow.
  useSwipeBack(onClose);

  return (
  <motion.div
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-0 bg-surface z-[120] flex flex-col pt-safe lg:max-w-md lg:left-auto lg:shadow-lg"
  >
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
      <button aria-label="戻る" onClick={onClose} className="p-1 -ml-1 text-ink">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-bold text-ink">お知らせ</h1>
    </div>

    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col pb-safe">
      <AnnouncementList />
    </div>
  </motion.div>
  );
};
