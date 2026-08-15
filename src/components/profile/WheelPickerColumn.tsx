import React, { useEffect, useRef } from 'react';

// One column of an iOS-style wheel picker.
//
// This replaces four hand-rolled copies (education / career / lecture /
// publication) that all shared the same two bugs:
//
//   1. Selection only changed on tap. Scrolling moved the list but never
//      updated the value, while the highlight band sat pinned at the centre —
//      so the band and the bold "selected" row drifted apart and spinning the
//      wheel appeared to do nothing at all.
//   2. Opening the picker never scrolled to the current value, so an already
//      chosen year sat off screen with the wheel parked at the top.
//
// The band is *not* a moving element: it marks the centre line, and whichever
// row is under it is the selection. That only reads as true if scrolling
// drives the value, which is what this component does.

/** Row height (h-8) and viewport height (h-48) in px — snap maths depends on both. */
const ITEM_HEIGHT = 32;
const VIEWPORT_HEIGHT = 192;
/** Pads the first/last rows so they can reach the centre line. */
const EDGE_PAD = (VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2;

interface WheelPickerColumnProps {
  items: number[];
  value: number | null | undefined;
  onChange: (value: number) => void;
  /** Renders the row label, e.g. `(y) => `${y}年``. */
  formatLabel: (item: number) => string;
  ariaLabel: string;
}

export const WheelPickerColumn: React.FC<WheelPickerColumnProps> = ({
  items, value, onChange, formatLabel, ariaLabel,
}) => {
  const scrollRef = useRef(null);
  // Set while we scroll programmatically, so the resulting scroll events do
  // not feed back into onChange and fight the user.
  const isSyncingRef = useRef(false);
  const frameRef = useRef(0);

  // Park the wheel on the current value when the picker opens. These pickers
  // unmount on close, so mount is the right moment and there is no need to
  // re-sync on every value change (which would cancel the user's own scroll).
  useEffect(() => {
    const el = scrollRef.current as HTMLElement | null;
    if (!el) return;
    const index = items.indexOf(value as number);
    if (index < 0) return;
    isSyncingRef.current = true;
    el.scrollTop = index * ITEM_HEIGHT;
    // Release after the scroll has been applied and its event has fired.
    const timer = window.setTimeout(() => { isSyncingRef.current = false; }, 120);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const handleScroll = () => {
    if (isSyncingRef.current) return;
    // Coalesce to one read per frame: scroll fires far more often than the
    // selection can meaningfully change.
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current as HTMLElement | null;
      if (!el) return;
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const next = items[Math.max(0, Math.min(items.length - 1, index))];
      if (next !== undefined && next !== value) onChange(next);
    });
  };

  const handleTap = (item: number) => {
    const el = scrollRef.current as HTMLElement | null;
    const index = items.indexOf(item);
    onChange(item);
    // Bring the tapped row under the centre band so the band keeps telling
    // the truth about what is selected.
    if (el && index >= 0) {
      isSyncingRef.current = true;
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
      window.setTimeout(() => { isSyncingRef.current = false; }, 300);
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      role="listbox"
      aria-label={ariaLabel}
      className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
      style={{ paddingTop: EDGE_PAD, paddingBottom: EDGE_PAD }}
    >
      {items.map((item) => (
        <div
          key={item}
          role="option"
          aria-selected={item === value}
          onClick={() => handleTap(item)}
          className={`h-8 flex items-center justify-center snap-center cursor-pointer ${
            item === value ? 'text-xl font-bold text-ink' : 'text-ink-faint'
          }`}
        >
          {formatLabel(item)}
        </div>
      ))}
    </div>
  );
};

/**
 * The centre line every column's selection is read from. Its wrapper must be
 * `relative` or it anchors to the sheet instead of the wheel — one of the four
 * originals was missing that and drifted.
 *
 * `-z-10` keeps it behind the row labels: negative z-index children paint
 * above the stacking context's own background but below normal content, so
 * the band sits between the sheet and the text rather than covering it.
 */
export const WheelPickerBand: React.FC = () => (
  <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-8 bg-primary-soft rounded-lg -z-10 pointer-events-none" />
);
