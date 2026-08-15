// Build config for the operator console — a separate artifact from the
// consumer app, deliberately.
//
// Why not a route inside the main app:
//
//  1. The consumer bundle is what Capacitor packages into the iOS and Android
//     apps. A route inside it would ship every admin screen, every collection
//     name and every moderation query to the phone of every member, where it
//     is trivially extractable, and put operator UI in front of App Store
//     review. Nothing here enters `dist/`, so nothing here reaches a device.
//
//  2. A separate artifact can be put behind a network gate (Cloudflare Access,
//     an IP allowlist, a VPN-only host) without touching the public app. That
//     is defence in depth on top of the Firestore rules, which remain the
//     actual enforcement — a network gate protects code and reconnaissance,
//     `isAdmin()` protects data.
//
//  3. It deploys on its own cadence. Shipping a moderation fix should never
//     mean shipping the consumer app.
//
// Source is shared, not duplicated: `src/services`, `src/types`, `src/firebase`
// and the design tokens in `src/index.css` are imported by both entries.
//
// Build:  npm run build:admin   → dist-admin/
// Dev:    npm run dev           → http://localhost:3000/admin.html
//         (the Vite middleware in server.ts serves any root HTML entry, so the
//         console shares the dev server; only the production builds split.)

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
    },
  },
});
