import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  EmailAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
// The popup/redirect resolver must NOT be supplied on native. Diagnosed
// on-device 2026-08, after the app hung on its loading spinner forever on a
// physical iPhone while working fine in the browser:
//
//   - On iOS, Firebase's BrowserPopupRedirectResolver reports
//     `_shouldInitProactively === true` (it checks `_isIOS()`), so
//     `initializeAuth` eagerly loads the gapi auth iframe from
//     apis.google.com before resolving.
//   - Capacitor serves the app from `capacitor://localhost` (see
//     capacitor.config.ts for why that cannot be changed), and Google's
//     endpoints reject that origin via CORS. The `gapi.iframes` module
//     therefore never arrives.
//   - Firebase's `loadGapi()` calls `gapi.load('gapi.iframes', { callback,
//     ontimeout })`. The callback *does* fire, so `ontimeout` never will —
//     but inside it, `resolve(gapi.iframes.getContext())` throws a
//     TypeError because `gapi.iframes` is undefined. That throw happens
//     outside the Promise executor, so the promise neither resolves nor
//     rejects: it stays pending forever.
//   - `initializeAuth` awaits it (its try/catch only helps for a rejection,
//     not a hang), so `onAuthStateChanged` never fires and the app's
//     `isAuthReady` gate never opens.
//
// Native sign-in does not need the resolver at all: App.tsx uses
// `FirebaseAuthentication.signInWithGoogle()` (native SDK) followed by
// `signInWithCredential`. Only the web branch calls `signInWithPopup`.
const isNative = Capacitor.isNativePlatform();

export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
  // Web only: signInWithPopup/signInWithRedirect throw auth/argument-error
  // unless a resolver is explicitly supplied — getAuth() includes this by
  // default, but initializeAuth() does not.
  ...(isNative ? {} : { popupRedirectResolver: browserPopupRedirectResolver }),
});
export const googleProvider = new GoogleAuthProvider();
export { EmailAuthProvider };

// Error handling for Firestore operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

/**
 * Logs a Firestore failure without rethrowing.
 *
 * Use this inside onSnapshot error callbacks and anywhere else that runs
 * outside a try/catch: `handleFirestoreError` throws, and a throw from a
 * listener callback escapes as an uncaught error (Capacitor surfaces it as a
 * "STARTUP JS ERROR") while also skipping whatever fallback the caller meant
 * to run after it.
 */
export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
