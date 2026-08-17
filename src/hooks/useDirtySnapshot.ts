import { useState } from 'react';

/**
 * Tracks whether a form has changed since it was opened.
 *
 * The profile editors all share one shape: `open()` seeds state from the
 * profile (or clears it for a new entry), the user edits, `handleSave()`
 * writes. None of them knew whether anything had actually changed, which is
 * what blocked them from getting the unsaved-changes prompt — without it the
 * prompt would fire on every exit, including forms nobody touched.
 *
 * Comparing against the seed rather than tracking "did any input fire" means
 * typing a value back to what it was counts as clean, which is the behaviour
 * people expect from a discard prompt.
 *
 * Serialising with JSON.stringify is fine here: these forms hold strings,
 * booleans and arrays of strings — no Dates, Maps or undefined-vs-missing
 * subtleties where key order or type coercion could mislead.
 *
 *   const dirty = useDirtySnapshot();
 *   const open = () => { const seed = profile?.skills ?? []; setSkills(seed);
 *                        dirty.capture(seed); setIsEditOpen(true); };
 *   return { …, isDirty: dirty.isDirty(skills) };
 */
export function useDirtySnapshot() {
  const [baseline, setBaseline] = useState('');

  return {
    /** Record what the form was seeded with. Call from open(). */
    capture: (value: unknown) => setBaseline(JSON.stringify(value)),
    /** True when the current value differs from the seed. */
    isDirty: (value: unknown) => JSON.stringify(value) !== baseline,
  };
}
