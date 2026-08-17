// Cloud Functions entry point for the OCR API.
//
// Why this exists: the installed app serves its bundle from
// `capacitor://localhost` (iOS) / `https://localhost` (Android), so a relative
// `/api/...` fetch resolves against the bundled assets and reaches no server.
// Card OCR and contour detection therefore failed 100% of the time on device
// while working in the browser, where the app and API share an origin. The app
// needs an absolute HTTPS origin to call, and this is it.

import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { createOcrRouter } from './ocrRoutes.js';
import { createLineRouter } from './lineRoutes.js';

// Managed by Secret Manager, injected at runtime. Never in source, never in
// the client bundle, and not readable from the deployed container's config.
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const lineClientId = defineSecret('LINE_CLIENT_ID');
const lineClientSecret = defineSecret('LINE_CLIENT_SECRET');

/** Where this function is publicly reachable. Used to build the LINE redirect
 *  URI, which must byte-for-byte match a callback URL registered in the LINE
 *  Developers console. */
const PUBLIC_ORIGIN =
  process.env.PUBLIC_ORIGIN
  || 'https://asia-northeast1-ai-studio-applet-webapp-c0fee.cloudfunctions.net/api';

/** Origins allowed to start a LINE login and receive the resulting token. */
const APP_ORIGINS = (process.env.ALLOWED_WEB_ORIGINS || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);

// Application Default Credentials — the function runs as a service account
// that already has Firebase Admin rights, so no key file is needed or wanted.
initializeApp();

const app = express();
app.use(
  createOcrRouter({
    auth: getAuth,
    // Deferred on purpose — see OcrRoutesOptions.getApiKey.
    getApiKey: () => geminiApiKey.value(),
    allowedOrigins: APP_ORIGINS,
  }),
);

app.use(
  createLineRouter({
    auth: getAuth,
    getClientId: () => lineClientId.value(),
    getClientSecret: () => lineClientSecret.value(),
    getPublicOrigin: () => PUBLIC_ORIGIN,
    allowedAppOrigins: APP_ORIGINS,
  }),
);

export const api = onRequest(
  {
    region: 'asia-northeast1', // Tokyo — this is a Japan-facing product
    secrets: [geminiApiKey, lineClientId, lineClientSecret],
    // Card images arrive base64-inlined, so requests are large and Gemini
    // calls are slow; the defaults (a few seconds) would cut them off.
    timeoutSeconds: 120,
    memory: '512MiB',
    // The per-user rate limit in ocrRoutes lives in one instance's memory, so
    // it only holds while instances are few. Capping them keeps that floor
    // meaningful and bounds a runaway Gemini bill.
    maxInstances: 5,
  },
  app,
);
