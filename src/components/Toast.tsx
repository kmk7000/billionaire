import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// In-app toasts, replacing window.alert().
//
// alert() was wrong here for three reasons: on iOS it renders a system dialog
// titled with the origin ("localhost の内容"), which is jarring inside a
// native app; it blocks the JS thread until dismissed; and it ignores the
// design system entirely. ui-ux-pro-max rates missing submit feedback as a
// High-severity issue and asks for toasts that auto-dismiss in 3–5s.
//
// The container is aria-live="polite" and never takes focus, so a screen
// reader announces the message without interrupting what the user is doing.

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Errors stay longer than confirmations — they usually carry instructions. */
const DURATION: Record<ToastVariant, number> = {
  success: 3000,
  info: 4000,
  error: 5000,
};

const VARIANT_STYLE: Record<ToastVariant, { icon: any; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: AlertCircle, className: 'text-danger' },
  info: { icon: Info, className: 'text-ink-muted' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = window.setTimeout(() => dismiss(id), DURATION[variant]);
    timers.current.push(timer);
  }, [dismiss]);

  useEffect(() => () => { timers.current.forEach(window.clearTimeout); }, []);

  // `push` is stable, so consumers never re-render just because of this value.
  const api: ToastApi = useMemo(() => ({
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'error'),
    info: (m: string) => push(m, 'info'),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* z-index sits above every overlay in the app (the card editor is the
          highest at z-[200]) so a toast is never hidden behind a sheet. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed left-0 right-0 bottom-0 z-[300] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, className } = VARIANT_STYLE[toast.variant];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                role="status"
                className="pointer-events-auto w-full max-w-md bg-surface border border-line rounded-lg shadow-md px-3.5 py-3 flex items-start gap-2.5"
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${className}`} />
                <p className="flex-1 text-[13px] text-ink leading-relaxed whitespace-pre-line">
                  {toast.message}
                </p>
                <button
                  aria-label="閉じる"
                  onClick={() => dismiss(toast.id)}
                  className="p-0.5 -m-0.5 rounded hover:bg-canvas transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-ink-faint" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
