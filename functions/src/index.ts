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
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { createOcrRouter } from './ocrRoutes.js';
import { createLineRouter, type PendingLogin, type PendingLoginStore } from './lineRoutes.js';

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

/** Pending native logins, in Firestore so the exchange still resolves when a
 *  different instance serves it than the one that ran the callback — with
 *  autoscaling that is the normal case, and an in-memory map would fail
 *  intermittently in a way that is miserable to reproduce.
 *
 *  The collection has no security rule, so the default deny applies and only
 *  the Admin SDK can touch it. take() deletes inside a transaction, which is
 *  what makes a code genuinely single-use under concurrency. */
/** This project's Firestore is a NAMED database, not `(default)` — see the
 *  `firestore` entry in firebase.json. getFirestore() with no argument talks
 *  to `(default)`, which does not exist here and fails with a bare
 *  `5 NOT_FOUND` that says nothing about the cause. */
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-7f866fe1-93c6-4327-800f-08b9693fa783';
const db = () => getFirestore(DATABASE_ID);

const pendingLogins: PendingLoginStore = {
  async save(code, pending) {
    await db().collection('line_auth_codes').doc(code).set(pending);
  },
  async take(code) {
    const ref = db().collection('line_auth_codes').doc(code);
    return db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      tx.delete(ref);
      return snap.data() as PendingLogin;
    });
  },
};

app.use(
  createLineRouter({
    auth: getAuth,
    store: pendingLogins,
    nativeScheme: 'com.billionaire.app',
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
