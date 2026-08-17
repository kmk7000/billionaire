import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * The app's confirm dialog.
 *
 * Extracted from the copy that lived inside MeishiDetailView so the several
 * places that need one stop redrawing the same scrim, card and button pair
 * slightly differently. z-[300]/[310] keeps it above every full-screen overlay
 * (the highest of those is z-[200]).
 */
export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button, for anything that destroys work. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen, title, message, confirmLabel, cancelLabel = 'キャンセル',
  destructive = false, onConfirm, onCancel,
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/50 z-[300]"
          onClick={onCancel}
        />
        <motion.div
          role="alertdialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
          animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
          className="fixed top-1/2 left-1/2 w-[90%] max-w-sm bg-surface rounded-2xl z-[310] p-6 text-center shadow-lg"
        >
          <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
          {message && <p className="text-sm text-ink-muted mb-6">{message}</p>}
          <div className={`flex gap-3 ${message ? '' : 'mt-6'}`}>
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-line rounded-lg font-bold text-ink-muted hover:bg-canvas transition-colors duration-200"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-white hover:opacity-90 transition-opacity duration-200 ${
                destructive ? 'bg-danger' : 'bg-primary'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
