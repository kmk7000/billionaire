// Thin client for the server-side /api/ocr/* routes (server.ts). The actual
// Gemini calls — and GEMINI_API_KEY — live only on the server; the browser
// never sees the key.

import { auth } from '../firebase';

async function callOcrRoute<T>(path: string, body: unknown): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Not signed in');

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

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
