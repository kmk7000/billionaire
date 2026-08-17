// Locates the business card inside a photo so it can be cropped and
// flattened. Corner detection runs through the server's /api/ocr/card-corners
// route (server.ts) rather than calling Gemini from the browser, so the API
// key never reaches the client bundle.

import { orderCorners, scanDocument, type Quad } from '../utils/documentScan';
import { detectCardCornersRemote, OcrUnavailableError } from './ocrClient';

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Gemini expresses image coordinates on a normalized 0-1000 grid. */
const COORD_SCALE = 1000;

/**
 * Ask the server for the four corners of the card. Returns null whenever the
 * answer is missing or implausible so the caller can fall back to the photo
 * as-is instead of showing a mangled crop.
 */
export async function detectCardCorners(dataUrl: string): Promise<Quad | null> {
  try {
    const { corners } = await detectCardCornersRemote(dataUrl);
    if (!Array.isArray(corners) || corners.length !== 4) return null;

    const { width, height } = await imageSize(dataUrl);
    const points = corners.map((p) => ({
      x: (p.x / COORD_SCALE) * width,
      y: (p.y / COORD_SCALE) * height,
    }));

    if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;

    const quad = orderCorners(points);
    if (!quad) return null;

    // Reject nonsense detections: a card that covers almost none of the frame
    // is far more likely to be a bad guess than a real photo.
    const area = Math.abs(
      (quad[0].x * quad[1].y - quad[1].x * quad[0].y) +
      (quad[1].x * quad[2].y - quad[2].x * quad[1].y) +
      (quad[2].x * quad[3].y - quad[3].x * quad[2].y) +
      (quad[3].x * quad[0].y - quad[0].x * quad[3].y)
    ) / 2;
    if (area < width * height * 0.05) return null;

    return quad;
  } catch (error) {
    // A null here means "no usable quad, fall back to the raw photo", which is
    // the right answer for a detection that simply did not find the card.
    // Being unable to ask at all is a different fact and has to reach the
    // caller, so it is re-thrown rather than flattened into null.
    if (error instanceof OcrUnavailableError) throw error;
    console.warn('Card corner detection failed:', error);
    return null;
  }
}

/**
 * Full auto-scan: locate the card, flatten it, and clean up the lighting.
 * Falls back to the untouched photo if anything goes wrong, so capture never
 * fails just because the enhancement did.
 */
export async function autoScanCard(
  dataUrl: string,
): Promise<{ scanned: string; detected: boolean; unavailable: boolean }> {
  try {
    const quad = await detectCardCorners(dataUrl);
    const scanned = await scanDocument(dataUrl, quad);
    return { scanned, detected: quad !== null, unavailable: false };
  } catch (error) {
    console.warn('Auto scan failed, keeping original image:', error);
    // "Fill the frame and retake" is useless advice when the detector was
    // never reachable — the caller needs to know which of the two happened.
    return {
      scanned: dataUrl,
      detected: false,
      unavailable: error instanceof OcrUnavailableError,
    };
  }
}
