import React from 'react';
import { ArrowLeft, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CertificatesEditor } from '../../hooks/useCertificatesEditor';
import { ConfirmDialog } from '../ConfirmDialog';
import { UNSAVED_CHANGES_DIALOG, useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

export const CertificatesModals: React.FC<{ certificates: CertificatesEditor }> = ({ certificates: c }) => {
  // Back arrow and left-edge swipe both route through the guard, so a
  // half-filled form cannot be discarded without asking.
  const guard = useUnsavedChangesGuard(c.isDirty, c.close, c.isEditOpen);

  return (
  <AnimatePresence>
    {c.isEditOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-surface z-[60] flex flex-col pt-safe"
      >
        <div className="sticky top-0 bg-surface z-20 border-b border-line">
          <div className="flex items-center justify-between p-4 relative">
            <div className="flex items-center gap-3">
              <button aria-label="戻る"
                onClick={guard.requestClose}
                className="p-1 -ml-1"
              >
                <ArrowLeft className="w-6 h-6 text-ink" />
              </button>
              <h2 className="text-lg font-bold text-ink">資格証編集</h2>
            </div>
            <button
              onClick={c.handleSave}
              className="font-bold text-primary text-sm"
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-ink">
                資格証
              </label>
              {c.certificatesList.map((cert, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) => c.changeCertificate(index, e.target.value)}
                    placeholder="例) 国際財務分析師(CFA)"
                    className="w-full h-[45px] px-4 border border-line rounded-md bg-surface text-ink placeholder-ink-faint focus:outline-none focus:border-primary focus:ring-0 pr-10"
                  />
                  {cert && (
                    <button
                      onClick={() => c.changeCertificate(index, '')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                    >
                      <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={c.addCertificateInput}
              className="flex items-center gap-2 text-ink font-bold py-2"
            >
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-sm leading-none">+</span>
              </div>
              追加
            </button>
          </div>
        </div>
      </motion.div>
    )}
    <ConfirmDialog
      isOpen={guard.isPrompting}
      {...UNSAVED_CHANGES_DIALOG}
      destructive
      onConfirm={guard.confirmDiscard}
      onCancel={guard.cancelDiscard}
    />
  </AnimatePresence>
  );
};
