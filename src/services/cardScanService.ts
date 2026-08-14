// Locates the business card inside a photo so it can be cropped and
// flattened. Reuses the Gemini model the OCR step already depends on rather
// than pulling a computer-vision runtime into the bundle.

import { orderCorners, scanDocument, type Quad } from '../utils/documentScan';

/** Gemini expresses image coordinates on a normalized 0-1000 grid. */
const COORD_SCALE = 1000;

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Ask Gemini for the four corners of the card. Returns null whenever the
 * answer is missing or implausible so the caller can fall back to the photo
 * as-is instead of showing a mangled crop.
 */
export async function detectCardCorners(dataUrl: string): Promise<Quad | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              text:
                'Find the single business card in this photo. Return the four ' +
                'outer corners of the card itself (not the photo border), as ' +
                'points on a 0-1000 normalized grid where x is measured left to ' +
                'right and y top to bottom. Order them clockwise starting from ' +
                'the card\'s top-left corner. If no card is clearly visible, ' +
                'return an empty list.',
            },
            { inlineData: { data: dataUrl.split(',')[1], mimeType: 'image/jpeg' } },
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

    const parsed = JSON.parse(response.text) as { corners?: { x: number; y: number }[] };
    const corners = parsed.corners;
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
    console.warn('Card corner detection failed:', error);
    return null;
  }
}

/**
 * Full auto-scan: locate the card, flatten it, and clean up the lighting.
 * Falls back to the untouched photo if anything goes wrong, so capture never
 * fails just because the enhancement did.
 */
export async function autoScanCard(dataUrl: string): Promise<{ scanned: string; detected: boolean }> {
  try {
    const quad = await detectCardCorners(dataUrl);
    const scanned = await scanDocument(dataUrl, quad);
    return { scanned, detected: quad !== null };
  } catch (error) {
    console.warn('Auto scan failed, keeping original image:', error);
    return { scanned: dataUrl, detected: false };
  }
}
