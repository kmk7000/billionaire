import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSwipeBack } from '../../hooks/useSwipeBack';

/**
 * Shell for the pages that hang off 設定 / もっと見る.
 *
 * Every full-screen overlay in this app repeats the same chrome: slide in from
 * the right, sticky header with a back arrow, scrollable body. Those headers
 * must stay pinned — see CLAUDE.md item 15, where an unpinned one let the
 * content scroll out of reach on device.
 */
export const SettingsSubPage: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  // Left-edge swipe goes back, same as the arrow. Gated on isOpen so a
  // closed page does not sit in the gesture stack.
  useSwipeBack(onClose, isOpen);

  return (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-surface z-[120] flex flex-col max-w-md mx-auto pt-safe"
      >
        <header className="sticky top-0 z-10 bg-surface h-[52px] flex items-center px-4 gap-3 shrink-0">
          <button aria-label="戻る" onClick={onClose} className="p-1 -ml-1">
            <ArrowLeft className="w-6 h-6 text-ink" />
          </button>
          <h1 className="text-lg font-bold text-ink">{title}</h1>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};

/** Section heading used inside the pages above. */
export const SubPageSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title, children,
}) => (
  <section className="px-5 py-6 border-b border-line last:border-b-0">
    <h2 className="text-[15px] font-bold text-ink mb-3">{title}</h2>
    <div className="text-[14px] text-ink-muted leading-relaxed space-y-3">{children}</div>
  </section>
);
