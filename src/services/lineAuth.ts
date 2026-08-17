// LINE Login on the installed app.
//
// The web flow opens a popup and receives the token by postMessage. Neither
// half of that exists here: Capacitor's WKWebView has no window.open (the same
// reason Google sign-in uses a native plugin — see CLAUDE.md item 8), and
// there is no opener to post back to. So the app opens the authorize page in
// the system browser and gets control back through a custom URL scheme.
//
// What comes back through that scheme is deliberately *not* the Firebase
// custom token. Custom schemes are not exclusive — any installed app can
// register `com.billionaire.app://` and receive the redirect — and a custom
// token is a complete sign-in credential for that account. The deep link
// carries a single-use code instead, and this module trades it for the token
// over HTTPS while proving it is the same client that started the flow: it
// commits to SHA-256(verifier) up front and presents the verifier at the end.
// An interceptor gets a code it cannot spend.

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { apiUrl } from './ocrClient';

const CALLBACK_HOST = 'line-auth';

function base64url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

/**
 * Runs the whole native flow and resolves with a Firebase custom token.
 *
 * Rejects if the user backs out of the browser, so the caller can tell a
 * cancellation from a failure and stay quiet about the former.
 */
export async function signInWithLineNative(): Promise<string> {
  const verifier = createVerifier();
  const challenge = await challengeFor(verifier);

  const urlResponse = await fetch(
    `${apiUrl('/api/auth/line/url')}?platform=native&challenge=${encodeURIComponent(challenge)}`,
  );
  if (!urlResponse.ok) {
    const detail = await urlResponse.json().catch(() => ({}));
    throw new Error(detail.error || `Could not start LINE login (${urlResponse.status})`);
  }
  const { url } = await urlResponse.json();

  // Wait for whichever happens first: the deep link, or the user dismissing
  // the browser. Both listeners are torn down either way — leaving the
  // appUrlOpen one attached would make a later, unrelated deep link resolve
  // this stale promise.
  const code = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const cleanups: Array<() => void> = [];
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanups.forEach((c) => c());
      fn();
    };

    App.addListener('appUrlOpen', ({ url: opened }) => {
      if (!opened.includes(CALLBACK_HOST)) return;
      let received: string | null = null;
      try {
        received = new URL(opened).searchParams.get('code');
      } catch {
        received = null;
      }
      void Browser.close().catch(() => {});
      finish(() => (received
        ? resolve(received)
        : reject(new Error('LINE login did not return a code.'))));
    }).then((handle) => cleanups.push(() => void handle.remove()));

    Browser.addListener('browserFinished', () => {
      finish(() => reject(new Error('LINE_LOGIN_CANCELLED')));
    }).then((handle) => cleanups.push(() => void handle.remove()));

    Browser.open({ url, presentationStyle: 'popover' }).catch((error) => {
      finish(() => reject(error));
    });
  });

  const exchange = await fetch(apiUrl('/api/auth/line/exchange'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, verifier }),
  });
  if (!exchange.ok) {
    const detail = await exchange.json().catch(() => ({}));
    throw new Error(detail.error || `LINE login could not be completed (${exchange.status})`);
  }

  const { customToken } = await exchange.json();
  if (!customToken) throw new Error('LINE login returned no token.');
  return customToken;
}

/** True when the user closed the browser instead of finishing. */
export function isLineLoginCancelled(error: unknown): boolean {
  return error instanceof Error && error.message === 'LINE_LOGIN_CANCELLED';
}
