// LINE Login: the authorize-URL endpoint and the OAuth callback.
//
// Shared by the dev server and the deployed function, same as ocrRoutes.
//
// Moving these off localhost changes their risk profile, so three things that
// were survivable on a dev machine are fixed here:
//
//   * `state` was the literal string 'random_state', with a comment admitting
//     it. On a public callback that is an open door: anyone can forge a
//     callback and have it accepted. It is now an HMAC-signed nonce with a
//     10-minute lifetime, and the callback rejects anything that does not
//     verify.
//   * The custom token was posted with `postMessage(..., '*')`, meaning any
//     window that opened this page could read a Firebase credential. The
//     opener's origin is now carried inside the signed state — checked
//     against an allowlist when issued — and the token is posted only there.
//   * The token was interpolated straight into a <script> string. Values are
//     now JSON-encoded into the document.

import express from 'express';
import type { Request, Response } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import axios from 'axios';

export interface LineAuthResult {
  createCustomToken(uid: string, claims?: object): Promise<string>;
}

export interface LineRoutesOptions {
  auth: () => LineAuthResult;
  /** Read lazily — under Cloud Functions these come from Secret Manager and
      are only bound at runtime. See OcrRoutesOptions.getApiKey. */
  getClientId: () => string | undefined;
  getClientSecret: () => string | undefined;
  /** Public origin this router is reachable at, used to build the redirect
      URI. Must match a callback URL registered in the LINE console. */
  getPublicOrigin: () => string | undefined;
  /** App origins allowed to start a login and receive the token. */
  allowedAppOrigins: string[];
}

const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** `<nonce>.<base36 issued-at>.<base64url opener origin>.<hmac>` */
function issueState(openerOrigin: string, secret: string): string {
  const payload = [
    randomBytes(16).toString('hex'),
    Date.now().toString(36),
    Buffer.from(openerOrigin).toString('base64url'),
  ].join('.');
  return `${payload}.${sign(payload, secret)}`;
}

function readState(state: string, secret: string): { openerOrigin: string } | null {
  const parts = state.split('.');
  if (parts.length !== 4) return null;
  const [nonce, issuedAt, originB64, sig] = parts;
  if (!safeEqual(sig, sign([nonce, issuedAt, originB64].join('.'), secret))) return null;

  const age = Date.now() - parseInt(issuedAt, 36);
  if (!Number.isFinite(age) || age < 0 || age > STATE_TTL_MS) return null;

  return { openerOrigin: Buffer.from(originB64, 'base64url').toString('utf8') };
}

export function createLineRouter({
  auth,
  getClientId,
  getClientSecret,
  getPublicOrigin,
  allowedAppOrigins,
}: LineRoutesOptions) {
  const router = express.Router();
  const allowed = new Set(allowedAppOrigins);

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

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || '';
    if (!allowed.has(origin)) {
      res.status(403).json({ error: `Origin ${origin || '(none)'} may not start a LINE login.` });
      return;
    }
    if (origin) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      state: issueState(origin, cfg.clientSecret),
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
    if (!verified || !allowed.has(verified.openerOrigin)) {
      // Forged, tampered with, or older than the window. Never exchange it.
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

  return router;
}
