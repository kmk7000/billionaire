// Thin client for the server-side /api/ocr/* routes (server.ts). The actual
// Gemini calls — and GEMINI_API_KEY — live only on the server; the browser
// never sees the key.

import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';

/**
 * Thrown when there is no server to call, as opposed to the server saying no.
 *
 * These two need completely different messages. "Could not read the card,
 * retake it somewhere brighter" is actively misleading when the truth is that
 * the request never left the device.
 */
export class OcrUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OcrUnavailableError';
  }
}

/**
 * Where the /api/ocr/* routes live.
 *
 * On the web the app and the API share an origin, so a relative path is right.
 * The installed app does not: iOS serves the bundle from `capacitor://localhost`
 * and Android from `https://localhost` (see capacitor.config.ts — the iOS
 * scheme cannot be changed). A relative '/api/...' there resolves against the
 * bundled assets, where no such route exists, so every OCR and card-contour
 * call failed on device while working perfectly in the browser. Native builds
 * therefore need an absolute URL to a deployed server.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function resolveUrl(path: string): string {
  if (API_BASE) return `${API_BASE}${path}`;
  if (Capacitor.isNativePlatform()) {
    throw new OcrUnavailableError(
      'VITE_API_BASE_URL is not set. The installed app has no local server, ' +
      'so /api/ocr/* must point at a deployed HTTPS origin.',
    );
  }
  return path;
}

/** Absolute origin of the API, or '' when a relative path is correct (web).
 *  Exported so non-OCR callers (LINE login) resolve the same way. */
export function apiUrl(path: string): string {
  return resolveUrl(path);
}

async function callOcrRoute<T>(path: string, body: unknown): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Not signed in');

  const url = resolveUrl(path);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // fetch only rejects when the request could not be made at all — offline,
    // DNS, TLS, CORS. The card is not the problem in any of those cases.
    throw new OcrUnavailableError(`Could not reach ${url}: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `${path} failed with ${response.status}`);
  }

  return response.json();
}

export interface MeishiOcrResult {
  name: string;
  company: string;
  position: string;
  department?: string;
  email: string;
  phone: string;
  mobile?: string;
  fax?: string;
  address?: string;
  detailedAddress?: string;
}

export function ocrMeishi(frontImage: string, backImage: string | null): Promise<MeishiOcrResult> {
  return callOcrRoute<MeishiOcrResult>('/api/ocr/meishi', { frontImage, backImage });
}

export function detectCardCornersRemote(image: string): Promise<{ corners: { x: number; y: number }[] }> {
  return callOcrRoute('/api/ocr/card-corners', { image });
}
