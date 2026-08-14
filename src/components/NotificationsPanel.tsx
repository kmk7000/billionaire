import React from 'react';
import { ArrowLeft, BellOff } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationsPanelProps {
  onClose: () => void;
}

// Honest empty state until a notifications backend (FCM / Firestore
// notifications collection) exists — no fake badge counts anywhere.
export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => (
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

    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-faint">
      <BellOff className="w-10 h-10" />
      <p className="text-sm">新しいお知らせはありません</p>
      <p className="text-xs text-ink-faint px-10 text-center leading-relaxed">
        コミュニティのコメントやいいねの通知は、プッシュ通知の提供開始時にここに表示されます。
      </p>
    </div>
  </motion.div>
);
