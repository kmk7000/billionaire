import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { Meishi } from '../types/app';
import { normalizePhoneNumber } from '../utils/phoneNumber';
import { syncCallerIdEntries, type CallerIdEntry } from '../native/callerIdIndex';

// Pushes the user's saved business cards into the iOS Call Directory
// Extension's lookup table (see src/native/callerIdIndex.ts for why this has
// to go through a native plugin at all). No-ops everywhere except native iOS
// — there is no equivalent API on the web, and the Android counterpart to
// this feature is a separate, not-yet-built native module.
//
// Deliberately excludes the user's own card (`isMyCard`): the point is
// identifying *other people* calling in, not matching the user's own number.
export function useCallerIdSync(meishis: Meishi[]) {
  // Guards against re-syncing identical data on every unrelated re-render —
  // each sync asks iOS to reload the extension, which is not free.
  const lastSyncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    const entries: CallerIdEntry[] = [];
    const seen = new Set<string>();

    meishis
      .filter((meishi) => !meishi.isMyCard)
      .forEach((meishi) => {
        const number = normalizePhoneNumber(meishi.mobile) || normalizePhoneNumber(meishi.phone);
        if (!number || seen.has(number)) return;
        seen.add(number);

        const label = meishi.company ? `${meishi.company} ${meishi.name}` : meishi.name;
        // iOS gives no documented hard cap, but keeps a short practical
        // budget for the label string — trim well inside it.
        entries.push({ number, label: label.slice(0, 60) });
      });

    const key = entries
      .map((entry) => `${entry.number}:${entry.label}`)
      .sort()
      .join(',');
    if (key === lastSyncedKey.current) return;
    lastSyncedKey.current = key;

    syncCallerIdEntries(entries).catch((error) => {
      // Most failures here mean the App Group entitlement isn't wired up yet
      // in Xcode (see CLAUDE.md) — not something to surface to the user.
      console.warn('Caller ID sync failed:', error);
    });
  }, [meishis]);
}
