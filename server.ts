import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

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
const PORT = 3000;

// Business card photos are base64-inlined JSON, well past Express's 100kb
// default body limit.
app.use(express.json({ limit: "15mb" }));

// --- Gemini-backed OCR routes ---------------------------------------------
// GEMINI_API_KEY lives only in this process's env, never in the client
// bundle. Every route below requires a valid Firebase ID token so the key
// can't be burned through by anonymous traffic hitting our server directly.

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

interface AuthedRequest extends Request {
  uid?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    console.error("Failed to verify ID token:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Minimal in-memory per-user rate limit. This is enough to stop a single
// account from running up the Gemini bill by accident (e.g. a retry loop);
// it resets on deploy and does not coordinate across instances, so treat it
// as a floor, not a full abuse-prevention system, once this scales past one
// server process.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestLog = new Map<string, number[]>();

function rateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  const uid = req.uid!;
  const now = Date.now();
  const timestamps = (requestLog.get(uid) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  timestamps.push(now);
  requestLog.set(uid, timestamps);
  next();
}

function requireGenAI(_req: Request, res: Response, next: NextFunction) {
  if (!genAI) {
    return res.status(503).json({ error: "GEMINI_API_KEY is not configured on the server" });
  }
  next();
}

app.post("/api/ocr/meishi", requireAuth, rateLimit, requireGenAI, async (req, res) => {
  const { frontImage, backImage } = req.body as { frontImage?: string; backImage?: string | null };
  if (!frontImage) {
    return res.status(400).json({ error: "frontImage is required" });
  }

  try {
    const parts: any[] = [
      {
        text:
          "Extract information from this business card. Return JSON with name, company, position, email, phone. " +
          "If a field is not found, use an empty string. Language is Japanese. If there are two images, the " +
          "second one is the back side of the card.",
      },
      { inlineData: { data: frontImage.split(",")[1] ?? frontImage, mimeType: "image/jpeg" } },
    ];
    if (backImage) {
      parts.push({ inlineData: { data: backImage.split(",")[1] ?? backImage, mimeType: "image/jpeg" } });
    }

    const response = await genAI!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            company: { type: Type.STRING },
            position: { type: Type.STRING },
            department: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            mobile: { type: Type.STRING },
            fax: { type: Type.STRING },
            address: { type: Type.STRING },
            detailedAddress: { type: Type.STRING },
          },
          required: ["name", "company", "position", "email", "phone"],
        },
      },
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Meishi OCR error:", error);
    res.status(502).json({ error: "OCR request failed" });
  }
});

app.post("/api/ocr/card-corners", requireAuth, rateLimit, requireGenAI, async (req, res) => {
  const { image } = req.body as { image?: string };
  if (!image) {
    return res.status(400).json({ error: "image is required" });
  }

  try {
    const response = await genAI!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text:
                "Find the single business card in this photo. Return the four outer corners of the card itself " +
                "(not the photo border), as points on a 0-1000 normalized grid where x is measured left to right " +
                "and y top to bottom. Order them clockwise starting from the card's top-left corner. If no card " +
                "is clearly visible, return an empty list.",
            },
            { inlineData: { data: image.split(",")[1] ?? image, mimeType: "image/jpeg" } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corners: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                },
                required: ["x", "y"],
              },
            },
          },
          required: ["corners"],
        },
      },
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Card corner detection error:", error);
    res.status(502).json({ error: "Corner detection request failed" });
  }
});

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
