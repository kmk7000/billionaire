import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.billionaire.app',
  appName: 'Billionaire',
  webDir: 'dist',
  server: {
    // Do NOT add `iosScheme: 'https'` here. It looks like it works but is
    // silently discarded: Capacitor's InstanceDescriptor.normalize() keeps a
    // scheme only when `WKWebView.handlesURLScheme(scheme) == false`, and
    // WKWebView handles https natively, so the value is thrown away and reset
    // to the default "capacitor". Verified on-device 2026-08 — the bundled
    // capacitor.config.json said "https" while the app logged
    // `Loading app at capacitor://localhost`. iOS therefore always serves
    // from capacitor://localhost, and any code that needs a normal web origin
    // (Firebase's gapi auth iframe, for one) has to be skipped on native
    // instead — see src/firebase.ts.
    androidScheme: 'https',
  },
  plugins: {
    FirebaseAuthentication: {
      // signInWithPopup doesn't work in a native WKWebView (no window.open
      // support, and Google blocks embedded-webview OAuth outright) — this
      // plugin does real native Google Sign-In instead.
      providers: ['google.com'],
      // We drive auth entirely through the Firebase JS SDK (src/firebase.ts),
      // not a separate native Firebase Auth instance. Without this, the
      // plugin signs into native Firebase Auth on its own AND we then also
      // call signInWithCredential from JS with the same one-time credential
      // — the second, redundant use of it is what was causing auth/internal-error.
      skipNativeAuth: true,
    },
  },
};

export default config;
