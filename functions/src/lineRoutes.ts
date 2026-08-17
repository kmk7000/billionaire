// LINE Login: authorize URL, OAuth callback, and the native code exchange.
//
// Shared by the dev server and the deployed function, same as ocrRoutes.
//
// Two client shapes, because the web and the installed app cannot use the same
// hand-off:
//
//   web    — a popup posts the Firebase custom token back to the opener via
//            postMessage, targeted at the exact origin that started the login.
//   native — Capacitor's WKWebView has no window.open, so the app opens the
//            authorize URL in a system browser and gets control back through a
//            custom URL scheme. The token is NOT put in that URL: custom
//            schemes are not exclusive, so any app that registers the same one
//            can receive the redirect, and a Firebase custom token is a full
//            sign-in credential. The deep link carries a single-use code, and
//            the app trades it for the token over HTTPS while proving it is
//            the same client that started the flow (PKCE-style: it sends a
//            verifier whose SHA-256 was committed to up front).
//
// Moving these off localhost also fixed three things that were survivable on a
// dev machine: `state` was the literal 'random_state' (anyone could forge a
// callback), the token went out via postMessage(..., '*') (any opener could
// read it), and it was interpolated raw into a <script> string.

import express from 'express';
import type { Request, Response } from 'express';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import axios from 'axios';

export interface LineAuthResult {
  createCustomToken(uid: string, claims?: object): Promise<string>;
}

export interface PendingLogin {
  customToken: string;
  /** base64url SHA-256 of the verifier the app will present. */
  challenge: string;
  expiresAt: number;
}

/** Short-lived store for native logins awaiting their exchange. Kept behind an
 *  interface so the dev server can use a Map and the deployment Firestore. */
export interface PendingLoginStore {
  save(code: string, pending: PendingLogin): Promise<void>;
  /** Must be single-use: return the entry and delete it in one step. */
  take(code: string): Promise<PendingLogin | null>;
}

export interface LineRoutesOptions {
  auth: () => LineAuthResult;
  store: PendingLoginStore;
  /** Read lazily — under Cloud Functions these come from Secret Manager and
      are only bound at runtime. See OcrRoutesOptions.getApiKey. */
  getClientId: () => string | undefined;
  getClientSecret: () => string | undefined;
  /** Public origin this router is reachable at, used to build the redirect
      URI. Must match a callback URL registered in the LINE console. */
  getPublicOrigin: () => string | undefined;
  /** App origins allowed to start a web login and receive the token. */
  allowedAppOrigins: string[];
  /** Custom URL scheme the installed app is registered for. */
  nativeScheme: string;
}

const STATE_TTL_MS = 10 * 60 * 1000;
const CODE_TTL_MS = 5 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

interface StatePayload {
  /** '' for native — the token never goes to a browser origin there. */
  openerOrigin: string;
  native: boolean;
  /** base64url SHA-256 of the app's verifier; native only. */
  challenge: string;
}

/** `<nonce>.<base36 issued-at>.<base64url json>.<hmac>` */
function issueState(payload: StatePayload, secret: string): string {
  const body = [
    randomBytes(16).toString('hex'),
    Date.now().toString(36),
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
  ].join('.');
  return `${body}.${sign(body, secret)}`;
}

function readState(state: string, secret: string): StatePayload | null {
  const parts = state.split('.');
  if (parts.length !== 4) return null;
  const [nonce, issuedAt, bodyB64, sig] = parts;
  if (!safeEqual(sig, sign([nonce, issuedAt, bodyB64].join('.'), secret))) return null;

  const age = Date.now() - parseInt(issuedAt, 36);
  if (!Number.isFinite(age) || age < 0 || age > STATE_TTL_MS) return null;

  try {
    return JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8')) as StatePayload;
  } catch {
    return null;
  }
}

export function createLineRouter({
  auth,
  store,
  getClientId,
  getClientSecret,
  getPublicOrigin,
  allowedAppOrigins,
  nativeScheme,
}: LineRoutesOptions) {
  const router = express.Router();
  const allowed = new Set(allowedAppOrigins);

  router.use(express.json({ limit: '64kb' }));

  function config() {
    // Trimmed, because the deployed secrets exist as blank placeholders until
    // real credentials are pasted in — a secret has to exist for the function
    // to deploy at all. Blank therefore means "not configured yet", not
    // "broken", and the routes answer 503 rather than failing at LINE.
    const clientId = getClientId()?.trim();
    const clientSecret = getClientSecret()?.trim();
    const publicOrigin = getPublicOrigin()?.trim();
    if (!clientId || !clientSecret || !publicOrigin) return null;
    return { clientId, clientSecret, redirectUri: `${publicOrigin}/api/auth/line/callback` };
  }

  router.get('/api/auth/line/url', (req: Request, res: Response) => {
    const cfg = config();
    if (!cfg) {
      // Said plainly rather than 500-ing: the credentials come from the LINE
      // Developers console and nobody can guess that from a stack trace.
      res.status(503).json({
        error: 'LINE login is not configured. LINE_CLIENT_ID, LINE_CLIENT_SECRET and the public origin must all be set.',
      });
      return;
    }

    const { platform, challenge } = req.query as { platform?: string; challenge?: string };
    const native = platform === 'native';

    let payload: StatePayload;
    if (native) {
      // No origin check here: the caller is an app, not a browser origin, so
      // there is nothing to check against. The challenge is what binds this
      // authorization to the client that asked for it.
      if (!challenge || challenge.length < 32 || challenge.length > 128) {
        res.status(400).json({ error: 'A PKCE challenge is required for native logins.' });
        return;
      }
      payload = { openerOrigin: '', native: true, challenge };
    } else {
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || '';
      if (!allowed.has(origin)) {
        res.status(403).json({ error: `Origin ${origin || '(none)'} may not start a LINE login.` });
        return;
      }
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      payload = { openerOrigin: origin, native: false, challenge: '' };
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      state: issueState(payload, cfg.clientSecret),
      scope: 'profile openid email',
    });
    res.json({ url: `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}` });
  });

  router.get('/api/auth/line/callback', async (req: Request, res: Response) => {
    const cfg = config();
    if (!cfg) {
      res.status(503).send('LINE login is not configured on this server.');
      return;
    }

    const { code, state } = req.query as { code?: string; state?: string };
    if (!code) {
      res.status(400).send('No code provided');
      return;
    }

    const verified = state ? readState(state, cfg.clientSecret) : null;
    // Forged, tampered with, or older than the window. Never exchange it.
    if (!verified) {
      res.status(400).send('Invalid or expired login request. Please try again.');
      return;
    }
    if (!verified.native && !allowed.has(verified.openerOrigin)) {
      res.status(400).send('Invalid or expired login request. Please try again.');
      return;
    }

    try {
      const tokenResponse = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: cfg.redirectUri,
          client_id: cfg.clientId,
          client_secret: cfg.clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const profileResponse = await axios.get('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      });

      const lineUser = profileResponse.data;
      const customToken = await auth().createCustomToken(`line:${lineUser.userId}`, {
        displayName: lineUser.displayName,
        photoURL: lineUser.pictureUrl,
        provider: 'line',
      });

      if (verified.native) {
        // Only a lookup key crosses the custom-scheme boundary. Whoever
        // receives it still has to present the verifier to get the token.
        const handoff = randomBytes(32).toString('base64url');
        await store.save(handoff, {
          customToken,
          challenge: verified.challenge,
          expiresAt: Date.now() + CODE_TTL_MS,
        });
        res.redirect(`${nativeScheme}://line-auth?code=${encodeURIComponent(handoff)}`);
        return;
      }

      // JSON-encoded into the script, and delivered only to the origin that
      // started this login.
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><title>ログイン</title></head>
<body>
<p>認証が完了しました。この画面は自動的に閉じます。</p>
<script>
  var payload = { type: 'OAUTH_AUTH_SUCCESS', customToken: ${JSON.stringify(customToken)} };
  var target = ${JSON.stringify(verified.openerOrigin)};
  if (window.opener) {
    window.opener.postMessage(payload, target);
    window.close();
  } else {
    document.body.textContent = 'このウィンドウを閉じて、アプリに戻ってください。';
  }
</script>
</body>
</html>`);
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data : (error as Error).message;
      console.error('LINE Auth error:', detail);
      res.status(500).send('Authentication failed');
    }
  });

  /** Native only: trade the single-use code for the custom token.
   *
   *  An interceptor who grabbed the deep link has the code but not the
   *  verifier, and the code dies on first use either way. */
  router.post('/api/auth/line/exchange', async (req: Request, res: Response) => {
    // No CORS headers on purpose — this is for the app, not a browser origin.
    const { code, verifier } = req.body as { code?: string; verifier?: string };
    if (!code || !verifier) {
      res.status(400).json({ error: 'code and verifier are required' });
      return;
    }

    const pending = await store.take(code);
    if (!pending || pending.expiresAt < Date.now()) {
      res.status(400).json({ error: 'This login has expired. Please try again.' });
      return;
    }
    if (!safeEqual(sha256(verifier), pending.challenge)) {
      res.status(403).json({ error: 'Verifier does not match this login.' });
      return;
    }

    res.json({ customToken: pending.customToken });
  });

  return router;
}
