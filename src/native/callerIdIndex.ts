// JS-side wrapper for the native `CallerIdIndexPlugin` (iOS only, see
// ios/App/App/Plugins/CallerIdIndexPlugin.swift and
// ios/App/CallDirectoryExtension/CallDirectoryHandler.swift).
//
// `entries` is sent as a JSON string rather than a typed array so this call
// does not depend on which Capacitor version's `getArray` overloads exist on
// the native side — see the matching comment in the Swift plugin.

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface CallerIdEntry {
  /** Digits-only E.164, no '+' — see src/utils/phoneNumber.ts. */
  number: string;
  /** Shown on the incoming-call screen. iOS gives no room for more than a short line. */
  label: string;
}

export type CallerIdStatus = 'enabled' | 'disabled' | 'unknown';

export interface CallerIdState {
  /**
   * Whether the native plugin answered at all. False on web/Android, and on
   * an iOS build where the plugin failed to register.
   *
   * Kept separate from the fields below because they are only meaningful once
   * this is true — reporting "the App Group is unavailable" when the real
   * problem is that nothing was asked sends the user to fix the wrong thing.
   */
  available: boolean;
  /** Whether the user switched the extension on in iOS Settings. */
  status: CallerIdStatus;
  /** False when the App Group entitlement is missing — nothing can be stored. */
  appGroupAvailable: boolean;
  /** How many numbers are currently in the shared container. */
  entryCount: number;
  /** Native error text, when the query itself failed. */
  error?: string;
}

export interface CallerIdSyncResult {
  /** How many numbers were written to the shared container. */
  count: number;
  /** Whether iOS accepted the request to reload the extension now. False is
      normal while the user has the extension switched off in Settings — the
      numbers are stored either way and load when iOS next runs it. */
  reloaded: boolean;
  reloadError?: string;
}

interface CallerIdIndexPlugin {
  sync(options: { payload: string }): Promise<CallerIdSyncResult>;
  getStatus(): Promise<Omit<CallerIdState, 'available'>>;
  openSettings(): Promise<void>;
}

const CallerIdIndex = registerPlugin<CallerIdIndexPlugin>('CallerIdIndex');

/** True only where a native Call Directory extension can exist at all. */
export const isCallerIdPlatform = Capacitor.getPlatform() === 'ios';

export async function syncCallerIdEntries(entries: CallerIdEntry[]): Promise<CallerIdSyncResult> {
  return CallerIdIndex.sync({ payload: JSON.stringify(entries) });
}

export async function getCallerIdState(): Promise<CallerIdState> {
  if (!isCallerIdPlatform) {
    return { available: false, status: 'unknown', appGroupAvailable: false, entryCount: 0 };
  }
  try {
    const native = await CallerIdIndex.getStatus();
    return { available: true, ...native };
  } catch (error: any) {
    // The plugin is missing from this build (see CLAUDE.md item 14 — an
    // app-target plugin that is not registered answers UNIMPLEMENTED). Say
    // exactly that instead of blaming the App Group, which was never asked.
    return {
      available: false,
      status: 'unknown',
      appGroupAvailable: false,
      entryCount: 0,
      error: error?.message || String(error),
    };
  }
}

export function openCallerIdSettings(): Promise<void> {
  return CallerIdIndex.openSettings();
}
