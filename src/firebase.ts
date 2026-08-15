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
// IndexedDB persistence can hang inside a Capacitor WKWebView on a real
// device — not by rejecting (which the fallback array below would recover
// from), but by never settling at all, so onAuthStateChanged never fires and
// the app is stuck on its loading spinner forever. Confirmed on-device
// 2026-08: this only surfaces on a real iOS device, never in the browser
// preview or the iOS Simulator's WebKit, which is why it went unnoticed
// until the first physical-device install. The fix is ordering, not just
// having a fallback: on native platforms put the synchronous, reliable
// localStorage-backed persistence first so the hang-prone IndexedDB path is
// never on the critical path to the first auth state resolution.
const authPersistence = Capacitor.isNativePlatform()
  ? [browserLocalPersistence, inMemoryPersistence]
  : [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence];

export const auth = initializeAuth(app, {
  persistence: authPersistence,
  // signInWithPopup/signInWithRedirect throw auth/argument-error unless a
  // resolver is explicitly supplied — getAuth() includes this by default,
  // but initializeAuth() does not.
  popupRedirectResolver: browserPopupRedirectResolver,
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
