import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import { createOcrRouter } from "./functions/src/ocrRoutes";
import { createLineRouter, type PendingLogin } from "./functions/src/lineRoutes";

dotenv.config({ path: ['.env.local', '.env'] });

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Try to initialize with default credentials or service account if provided
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (fs.existsSync(serviceAccountPath)) {
  serviceAccountKey = fs.readFileSync(serviceAccountPath, 'utf8');
}

const isJson = serviceAccountKey?.trim().startsWith('{');

if (serviceAccountKey && isJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized with service account key.");
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:", error);
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
} else {
  if (serviceAccountKey && !isJson) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is provided but does not appear to be a JSON string. Initializing without service account cert.");
  }
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- Gemini-backed OCR routes ---------------------------------------------
// Mounted from the same module the deployed Cloud Function uses
// (functions/src/ocrRoutes.ts), so what is verified here is what runs on the
// device. These handlers used to live inline in this file, which meant the
// deployed copy and the dev copy were free to drift apart.

app.use(createOcrRouter({
  auth: () => admin.auth(),
  getApiKey: () => process.env.GEMINI_API_KEY,
}));

// --- LINE Login ------------------------------------------------------------
// Same router the deployed function mounts (functions/src/lineRoutes.ts).

// Dev runs a single process, so a map is enough here.
const pendingLogins = new Map<string, PendingLogin>();

app.use(createLineRouter({
  auth: () => admin.auth(),
  store: {
    async save(code, pending) { pendingLogins.set(code, pending); },
    async take(code) {
      const found = pendingLogins.get(code) ?? null;
      pendingLogins.delete(code);
      return found;
    },
  },
  nativeScheme: 'com.billionaire.app',
  getClientId: () => process.env.LINE_CLIENT_ID,
  getClientSecret: () => process.env.LINE_CLIENT_SECRET,
  getPublicOrigin: () => process.env.APP_URL,
  allowedAppOrigins: [process.env.APP_URL || 'http://localhost:3000'],
}));

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
