import React from 'react';

/**
 * The one floating action button used by every tab.
 *
 * Before this the three tabs each rolled their own: bottom-20 vs bottom-24,
 * py-3 vs py-3.5, z-30 vs z-20, and only the community one bothered with
 * lg:hidden. None accounted for the home-indicator inset, so on a real iPhone
 * the Today button sat on top of the bottom nav.
 *
 * The outer wrapper is constrained to the same max-w-md column as the nav, so
 * the button tracks the app's content edge instead of the viewport edge, and
 * is pointer-events-none so it never swallows taps meant for the page.
 * Hidden from `lg` up, where the desktop header carries these actions itself.
 */
export const Fab: React.FC<{
  onClick: () => void;
  /** Required when the button is icon-only. */
  ariaLabel?: string;
  shape?: 'pill' | 'circle';
  children: React.ReactNode;
}> = ({ onClick, ariaLabel, shape = 'pill', children }) => (
  <div className="fixed inset-x-0 bottom-0 z-30 max-w-md mx-auto pointer-events-none lg:hidden">
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`pointer-events-auto absolute right-4 bottom-above-nav bg-primary text-white rounded-full shadow-lg flex items-center justify-center font-bold hover:opacity-90 active:scale-95 transition-transform duration-200 ${
        shape === 'circle' ? 'w-14 h-14' : 'gap-2 px-5 py-3.5'
      }`}
    >
      {children}
    </button>
  </div>
);
