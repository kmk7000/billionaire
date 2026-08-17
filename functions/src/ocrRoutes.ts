// The Gemini-backed OCR routes, in one place.
//
// Both the dev server (server.ts) and the deployed Cloud Function
// (functions/src/index.ts) mount this same router, so the thing verified in
// the browser is the thing that runs on the device. Keeping two copies of
// these handlers is how they quietly stop matching.
//
// GEMINI_API_KEY never leaves the server process. Every route requires a valid
// Firebase ID token so the key cannot be burned through by anonymous traffic
// hitting the endpoint directly.

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

/** Origins allowed to call these routes.
 *
 *  The installed app is not a normal web origin: iOS serves the bundle from
 *  `capacitor://localhost` and Android from `https://localhost` (see
 *  capacitor.config.ts — the iOS scheme cannot be changed). Those two are the
 *  whole reason this deployment exists, so they must be here or the browser
 *  blocks the request before the server ever sees it. */
const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'ionic://localhost',
  'https://localhost',
  'http://localhost:3000',
]);

interface AuthedRequest extends Request {
  uid?: string;
}

/**
 * Just enough of firebase-admin's Auth to check a caller.
 *
 * Declared structurally rather than imported: the dev server and the functions
 * package each carry their own firebase-admin install, and importing the class
 * type makes the two nominally incompatible even though they are the same
 * library. It also means this router can be exercised with a stub.
 */
export interface TokenVerifier {
  verifyIdToken(idToken: string): Promise<{ uid: string }>;
}

export interface OcrRoutesOptions {
  /** Verifies caller ID tokens. */
  auth: () => TokenVerifier;
  /**
   * Read on first use, not at import.
   *
   * Under Cloud Functions the key comes from Secret Manager and is only bound
   * once the instance is actually serving; reading it while the deploy tooling
   * is still analysing the module yields nothing. A getter lets the same
   * router work in both places.
   */
  getApiKey: () => string | undefined;
  /** Extra origins to allow, e.g. the deployed web app. */
  allowedOrigins?: string[];
}

export function createOcrRouter({ auth, getApiKey, allowedOrigins = [] }: OcrRoutesOptions) {
  const router = express.Router();
  const origins = new Set([...ALLOWED_ORIGINS, ...allowedOrigins]);

  let cached: GoogleGenAI | null = null;
  function genAIClient(): GoogleGenAI | null {
    if (cached) return cached;
    const key = getApiKey();
    if (!key) return null;
    cached = new GoogleGenAI({ apiKey: key });
    return cached;
  }

  // Business card photos are base64-inlined JSON, well past Express's 100kb
  // default body limit.
  router.use(express.json({ limit: '15mb' }));

  router.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && origins.has(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Max-Age', '3600');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    next();
  });

  async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }
    try {
      const decoded = await auth().verifyIdToken(token);
      req.uid = decoded.uid;
      next();
    } catch (error) {
      console.error('Failed to verify ID token:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Minimal in-memory per-user rate limit. Enough to stop one account running
  // up the Gemini bill by accident (a retry loop, say). It resets on deploy and
  // does not coordinate across instances — with Cloud Run autoscaling there can
  // be several — so treat it as a floor, not abuse prevention. maxInstances is
  // capped in index.ts for the same reason.
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
  const RATE_LIMIT_MAX_REQUESTS = 30;
  const requestLog = new Map<string, number[]>();

  function rateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
    const uid = req.uid!;
    const now = Date.now();
    const timestamps = (requestLog.get(uid) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    timestamps.push(now);
    requestLog.set(uid, timestamps);
    next();
  }

  function requireGenAI(_req: Request, res: Response, next: NextFunction) {
    if (!genAIClient()) {
      res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server' });
      return;
    }
    next();
  }

  router.post('/api/ocr/meishi', requireAuth, rateLimit, requireGenAI, async (req, res) => {
    const { frontImage, backImage } = req.body as { frontImage?: string; backImage?: string | null };
    if (!frontImage) {
      res.status(400).json({ error: 'frontImage is required' });
      return;
    }

    try {
      const parts: object[] = [
        {
          text:
            'Extract information from this business card. Return JSON with name, company, position, email, phone. ' +
            'If a field is not found, use an empty string. Language is Japanese. If there are two images, the ' +
            'second one is the back side of the card.',
        },
        { inlineData: { data: frontImage.split(',')[1] ?? frontImage, mimeType: 'image/jpeg' } },
      ];
      if (backImage) {
        parts.push({ inlineData: { data: backImage.split(',')[1] ?? backImage, mimeType: 'image/jpeg' } });
      }

      const response = await genAIClient()!.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts }],
        config: {
          responseMimeType: 'application/json',
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
            required: ['name', 'company', 'position', 'email', 'phone'],
          },
        },
      });

      res.json(JSON.parse(response.text!));
    } catch (error) {
      console.error('Meishi OCR error:', error);
      res.status(502).json({ error: 'OCR request failed' });
    }
  });

  router.post('/api/ocr/card-corners', requireAuth, rateLimit, requireGenAI, async (req, res) => {
    const { image } = req.body as { image?: string };
    if (!image) {
      res.status(400).json({ error: 'image is required' });
      return;
    }

    try {
      const response = await genAIClient()!.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                text:
                  'Find the single business card in this photo. Return the four outer corners of the card itself ' +
                  '(not the photo border), as points on a 0-1000 normalized grid where x is measured left to right ' +
                  'and y top to bottom. Order them clockwise starting from the card\'s top-left corner. If no card ' +
                  'is clearly visible, return an empty list.',
              },
              { inlineData: { data: image.split(',')[1] ?? image, mimeType: 'image/jpeg' } },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
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
                  required: ['x', 'y'],
                },
              },
            },
            required: ['corners'],
          },
        },
      });

      res.json(JSON.parse(response.text!));
    } catch (error) {
      console.error('Card corner detection error:', error);
      res.status(502).json({ error: 'Corner detection request failed' });
    }
  });

  /** Cheap liveness probe — useful for confirming the deploy and the client's
      base URL without spending a Gemini call. */
  router.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: !!genAIClient() });
  });

  return router;
}
