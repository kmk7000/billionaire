import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.billionaire.app',
  appName: 'Billionaire',
  webDir: 'dist',
  server: {
    // Firebase Auth's init warm-up request fails under WKWebView's default
    // capacitor:// custom scheme (CORS/redirect check error) — https://localhost
    // gives it a normal secure-context origin instead.
    iosScheme: 'https',
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
