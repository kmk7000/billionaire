import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Capacitor} from '@capacitor/core';
import App from './App.tsx';
import { ToastProvider } from './components/Toast';
import './index.css';

// iOS zooms the entire page whenever a focused input's font-size is under
// 16px, and with no maximum-scale in the viewport there is no way back — the
// user is stranded at the zoomed scale (reproduced on-device 2026-08 on the
// 学歴追加 school search field). Roughly 66 inputs across the app are 13–15px
// by design, so locking the scale is the right fix rather than inflating
// every field to 16px and breaking the type scale.
//
// Native only. WKWebView honours viewport scale limits (Capacitor leaves
// `ignoresViewportScaleLimits` at WebKit's default of false), and a native app
// is not expected to pinch-zoom its own chrome. The web build deliberately
// keeps pinch-zoom, where it is a real accessibility affordance.
if (Capacitor.isNativePlatform()) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
