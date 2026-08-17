import { useCallback, useState } from 'react';
import { useSwipeBack } from './useSwipeBack';

/**
 * Guards a form's exit paths when there is unsaved input.
 *
 * Edit screens were deliberately left out of the swipe-back gesture because a
 * stray swipe would silently discard whatever had been typed — and a swipe is
 * far easier to trigger by accident than a button. This closes that gap by
 * making the *check* the thing that is shared rather than the gesture: the
 * back arrow and the swipe both go through `requestClose`, so they cannot
 * drift apart, and neither can throw work away without asking.
 *
 * Clean forms close immediately — a confirm on a form nobody touched is just
 * an extra tap.
 *
 * Usage:
 *   const guard = useUnsavedChangesGuard(isDirty, onBack);
 *   <button onClick={guard.requestClose}>…</button>
 *   <ConfirmDialog isOpen={guard.isPrompting} … onConfirm={guard.confirmDiscard}
 *                  onCancel={guard.cancelDiscard} />
 */
export function useUnsavedChangesGuard(isDirty: boolean, onClose: () => void, enabled: boolean = true) {
  const [isPrompting, setIsPrompting] = useState(false);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setIsPrompting(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const confirmDiscard = useCallback(() => {
    setIsPrompting(false);
    onClose();
  }, [onClose]);

  const cancelDiscard = useCallback(() => setIsPrompting(false), []);

  // Suspended while the dialog is up: the prompt is itself the topmost thing
  // on screen, and a second swipe under it should not queue another exit.
  useSwipeBack(requestClose, enabled && !isPrompting);

  return { isPrompting, requestClose, confirmDiscard, cancelDiscard };
}

/** Copy shared by every unsaved-changes prompt, so they read identically. */
export const UNSAVED_CHANGES_DIALOG = {
  title: '編集内容を破棄しますか？',
  message: '保存していない変更は失われます。',
  confirmLabel: '破棄する',
  cancelLabel: '編集を続ける',
} as const;
