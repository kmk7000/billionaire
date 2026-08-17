import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import { createOcrRouter } from "./functions/src/ocrRoutes";

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

// API routes
app.get("/api/auth/line/url", (req, res) => {
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const clientId = "2009585479";
  
  if (!clientId) {
    return res.status(500).json({ error: "LINE_CLIENT_ID is not set" });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: 'random_state', // In a real app, use a secure random string and verify it
    scope: 'profile openid email',
  });

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const clientId = "2009585479";
  const clientSecret = process.env.LINE_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      "https://api.line.me/oauth2/v2.1/token",
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { id_token } = tokenResponse.data;

    // Decode ID token to get user info (or use /v2/profile)
    // For simplicity, we'll use the profile endpoint
    const profileResponse = await axios.get("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
      },
    });

    const lineUser = profileResponse.data;
    const uid = `line:${lineUser.userId}`;

    // Create Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(uid, {
      displayName: lineUser.displayName,
      photoURL: lineUser.pictureUrl,
      provider: 'line',
    });

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                customToken: '${customToken}' 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("LINE Auth error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed");
  }
});

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
