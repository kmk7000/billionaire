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

/**
 * Every number a card can be called from, as caller-ID entries.
 *
 * A card carries both 携帯電話 and 電話番号 and a person may well ring from
 * either, so both are registered — an earlier version took `mobile || phone`
 * and silently dropped the office line, which is why calls from a card's
 * second number came through unidentified. FAX is deliberately left out: it
 * does not place voice calls.
 *
 * Exported so the settings sheet can show how many numbers are registered
 * without duplicating the rules.
 */
export function buildCallerIdEntries(meishis: Meishi[]): CallerIdEntry[] {
  const entries: CallerIdEntry[] = [];
  const seen = new Set<string>();

  meishis
    // The user's own card, current or retired, is not someone calling them.
    .filter((meishi) => !meishi.isMyCard && !meishi.isPastMyCard)
    .forEach((meishi) => {
      const label = (meishi.company ? `${meishi.company} ${meishi.name}` : meishi.name || '').trim();
      if (!label) return;

      [meishi.mobile, meishi.phone].forEach((raw) => {
        const number = normalizePhoneNumber(raw);
        if (!number || seen.has(number)) return;
        seen.add(number);
        // iOS gives no documented hard cap but keeps a short practical budget
        // for the label string — trim well inside it.
        entries.push({ number, label: label.slice(0, 60) });
      });
    });

  return entries;
}

/**
 * Keeps the device's caller-ID index in step with the saved cards.
 *
 * `enabled` is the in-app switch. iOS gives no API to turn the extension
 * itself on or off — only the user can, in Settings — but what the extension
 * has to work with is entirely ours: switching off writes an empty index, so
 * calls stop being identified even while the iOS toggle stays on. That is a
 * real off, not a cosmetic one, and it is the only honest one available.
 */
export function useCallerIdSync(meishis: Meishi[], enabled: boolean = true) {
  // Guards against re-syncing identical data on every unrelated re-render —
  // each sync asks iOS to reload the extension, which is not free.
  const lastSyncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    const entries = enabled ? buildCallerIdEntries(meishis) : [];
    const key = entries
      .map((entry) => `${entry.number}:${entry.label}`)
      .sort()
      .join(',');
    if (key === lastSyncedKey.current) return;
    lastSyncedKey.current = key;

    syncCallerIdEntries(entries).catch((error) => {
      // Left quiet here on purpose: this runs on every card change and a toast
      // would fire at random moments. 設定 > 着信時に相手の名刺情報を表示 has a
      // 今すぐ同期 button that reports the same failure where the user is
      // actually looking for it.
      console.warn('Caller ID sync failed:', error);
    });
  }, [meishis, enabled]);
}
