import { useEffect, useRef } from 'react';

/**
 * Edge-swipe-to-go-back for the app's full-screen overlays.
 *
 * iOS gives WKWebView a native back gesture, but it drives *webview history*,
 * and these overlays are React state — there is no history entry to pop, so the
 * system gesture does nothing here (on the web build it would leave the SPA
 * entirely). This reproduces the interaction the OS would give a native screen:
 * start at the left edge, drag right, and the screen goes back.
 *
 * Deliberately conservative about what counts:
 *
 *   - It must start within EDGE_ZONE of the left edge. Anywhere else and a
 *     horizontal drag is far more likely to be the user scrolling one of this
 *     app's horizontal strips (名刺帳's tab row, the community chip bar).
 *   - If the touch begins inside something horizontally scrollable that still
 *     has somewhere left to go, the gesture belongs to that element.
 *   - It must travel further horizontally than vertically, so a diagonal that
 *     is mostly a vertical scroll never fires.
 *   - Multi-touch is abandoned — a pinch is not a back gesture.
 *
 * Only the most recently mounted overlay reacts. These overlays stack (profile
 * → career editor → school search), and since the listener lives on `window`
 * every open one would otherwise see the same swipe and close together.
 */

/** How far from the left edge a swipe must begin, in CSS px. Roughly the width
 *  of the iOS system back-gesture zone. */
const EDGE_ZONE = 28;
/** Horizontal travel required to commit. */
const TRIGGER_DISTANCE = 70;
/** Beyond this the gesture reads as a scroll, not a back swipe. */
const MAX_OFF_AXIS = 45;

/** Mounted handlers, deepest overlay last. */
const stack: Array<{ current: (() => void) | undefined }> = [];

function startsInsideHorizontalScroller(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const scrollsX = style.overflowX === 'auto' || style.overflowX === 'scroll';
    // Only a scroller with somewhere left to go owns the gesture. One already
    // at its start has nothing to reveal, so a rightward drag is free.
    if (scrollsX && node.scrollWidth > node.clientWidth && node.scrollLeft > 0) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

let listenersAttached = false;
let startX = 0;
let startY = 0;
let tracking = false;

function topHandler(): (() => void) | undefined {
  return stack.length ? stack[stack.length - 1].current : undefined;
}

function onTouchStart(event: TouchEvent) {
  tracking = false;
  if (event.touches.length !== 1 || !topHandler()) return;
  const touch = event.touches[0];
  if (touch.clientX > EDGE_ZONE) return;
  if (startsInsideHorizontalScroller(event.target)) return;
  startX = touch.clientX;
  startY = touch.clientY;
  tracking = true;
}

function onTouchMove(event: TouchEvent) {
  if (!tracking) return;
  if (event.touches.length !== 1) {
    tracking = false;
    return;
  }
  if (Math.abs(event.touches[0].clientY - startY) > MAX_OFF_AXIS) tracking = false;
}

function onTouchEnd(event: TouchEvent) {
  if (!tracking) return;
  tracking = false;
  const touch = event.changedTouches[0];
  if (!touch) return;
  const dx = touch.clientX - startX;
  const dy = Math.abs(touch.clientY - startY);
  if (dx >= TRIGGER_DISTANCE && dx > dy) topHandler()?.();
}

function onTouchCancel() {
  tracking = false;
}

function attachListeners() {
  if (listenersAttached) return;
  // Passive: this never calls preventDefault, so it must not be allowed to
  // block scrolling while it decides.
  const opts: AddEventListenerOptions = { passive: true };
  window.addEventListener('touchstart', onTouchStart, opts);
  window.addEventListener('touchmove', onTouchMove, opts);
  window.addEventListener('touchend', onTouchEnd, opts);
  window.addEventListener('touchcancel', onTouchCancel, opts);
  listenersAttached = true;
}

function detachListeners() {
  if (!listenersAttached) return;
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
  window.removeEventListener('touchcancel', onTouchCancel);
  listenersAttached = false;
}

export function useSwipeBack(onBack: (() => void) | undefined, enabled: boolean = true) {
  // Held in a ref so a re-render between touchstart and touchend cannot swap
  // the handler out mid-gesture and leave the stack holding a stale closure.
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    if (!enabled || !onBack) return;
    stack.push(handlerRef);
    attachListeners();
    return () => {
      const index = stack.indexOf(handlerRef);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0) detachListeners();
    };
    // handlerRef is stable; `onBack` only gates whether we register at all.
  }, [enabled, !!onBack]);
}
