// JS-side wrapper for the native `CallerIdIndexPlugin` (iOS only, see
// ios/App/App/Plugins/CallerIdIndexPlugin.swift and
// ios/App/CallDirectoryExtension/CallDirectoryHandler.swift).
//
// `entries` is sent as a JSON string rather than a typed array so this call
// does not depend on which Capacitor version's `getArray` overloads exist on
// the native side — see the matching comment in the Swift plugin.

import { registerPlugin } from '@capacitor/core';

export interface CallerIdEntry {
  /** Digits-only E.164, no '+' — see src/utils/phoneNumber.ts. */
  number: string;
  /** Shown on the incoming-call screen. iOS gives no room for more than a short line. */
  label: string;
}

export type CallerIdStatus = 'enabled' | 'disabled' | 'unknown';

export interface CallerIdState {
  /** Whether the user switched the extension on in iOS Settings. */
  status: CallerIdStatus;
  /** False when the App Group entitlement is missing — nothing can be stored. */
  appGroupAvailable: boolean;
  /** How many numbers are currently in the shared container. */
  entryCount: number;
}

interface CallerIdIndexPlugin {
  sync(options: { payload: string }): Promise<{ count: number }>;
  getStatus(): Promise<CallerIdState>;
  openSettings(): Promise<void>;
}

const CallerIdIndex = registerPlugin<CallerIdIndexPlugin>('CallerIdIndex');

export async function syncCallerIdEntries(entries: CallerIdEntry[]): Promise<number> {
  const result = await CallerIdIndex.sync({ payload: JSON.stringify(entries) });
  return result.count;
}

export async function getCallerIdState(): Promise<CallerIdState> {
  try {
    return await CallerIdIndex.getStatus();
  } catch {
    return { status: 'unknown', appGroupAvailable: false, entryCount: 0 };
  }
}

export function openCallerIdSettings(): Promise<void> {
  return CallerIdIndex.openSettings();
}
