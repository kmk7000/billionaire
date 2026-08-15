import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

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
    Keyboard: {
      // Without this the WKWebView keeps its full height when the keyboard
      // opens. iOS then scrolls the *document* to reveal the focused field,
      // and because `position: fixed` is anchored to the layout viewport
      // (not the shrunken visual one), every full-screen overlay visually
      // slides up with it — the user lands on the blank bottom of the
      // overlay with the field pushed off screen.
      //
      // Measured on-device 2026-08 with the 学歴追加 school search open:
      // documentElement.scrollTop was 595 while the overlay's own scrollTop
      // was 0, i.e. the overlay never scrolled — the document did.
      //
      // `Native` resizes the web view itself to the area above the keyboard,
      // so `fixed inset-0` matches what is actually visible and iOS has no
      // reason to scroll anything.
      resize: KeyboardResize.Native,
    },
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
