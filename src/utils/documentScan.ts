// Document-scanner style image cleanup, implemented on plain canvas so it
// works identically on the web build and inside the Capacitor WebView.
//
// Pipeline: detected corner quad -> perspective warp to a flat rectangle ->
// flat-field correction (divide by a heavily blurred copy) to erase uneven
// lighting and shadows -> contrast curve.

export interface Point {
  x: number;
  y: number;
}

/** Four corners in TL, TR, BR, BL order. */
export type Quad = [Point, Point, Point, Point];

/**
 * Put four arbitrary points into TL, TR, BR, BL order by sorting them
 * clockwise around their centroid, then rotating so the top-left is first.
 */
export function orderCorners(points: Point[]): Quad | null {
  if (points.length !== 4) return null;

  const cx = points.reduce((sum, p) => sum + p.x, 0) / 4;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / 4;

  const sorted = [...points].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );

  // atan2 starts at the negative-x axis going clockwise in screen coords, so
  // the top-left point is whichever is closest to the origin corner.
  let startIndex = 0;
  let smallest = Infinity;
  sorted.forEach((p, i) => {
    const score = p.x + p.y;
    if (score < smallest) {
      smallest = score;
      startIndex = i;
    }
  });

  return [
    sorted[startIndex % 4],
    sorted[(startIndex + 1) % 4],
    sorted[(startIndex + 2) % 4],
    sorted[(startIndex + 3) % 4],
  ];
}

/** Solve an n x n linear system by Gaussian elimination with partial pivoting. */
function solveLinearSystem(matrix: number[][], rhs: number[]): number[] | null {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-10) return null; // degenerate quad
    [a[col], a[pivot]] = [a[pivot], a[col]];

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col] / a[col][col];
      for (let k = col; k <= n; k++) a[row][k] -= factor * a[col][k];
    }
  }

  // Fully eliminated, so each row reads pivot * x_i = rhs.
  return a.map((row, i) => row[n] / row[i]);
}

/**
 * Homography mapping the output rectangle back onto the source quad, so we can
 * iterate over destination pixels and sample the source (inverse mapping
 * avoids the holes a forward mapping would leave).
 */
function destToSrcHomography(quad: Quad, width: number, height: number): number[] | null {
  const dst: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  const matrix: number[][] = [];
  const rhs: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = dst[i];
    const { x, y } = quad[i];
    matrix.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    rhs.push(x);
    matrix.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    rhs.push(y);
  }

  return solveLinearSystem(matrix, rhs);
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Warp the quad region of `source` into a flat, front-facing rectangle. */
export function warpPerspective(
  source: HTMLCanvasElement,
  quad: Quad,
  maxSize = 1400
): HTMLCanvasElement | null {
  // Size the output from the quad itself so we keep the card's real shape
  // instead of forcing an assumed aspect ratio.
  const widthEstimate = Math.max(distance(quad[0], quad[1]), distance(quad[3], quad[2]));
  const heightEstimate = Math.max(distance(quad[0], quad[3]), distance(quad[1], quad[2]));
  if (widthEstimate < 8 || heightEstimate < 8) return null;

  const scale = Math.min(1, maxSize / Math.max(widthEstimate, heightEstimate));
  const outWidth = Math.round(widthEstimate * scale);
  const outHeight = Math.round(heightEstimate * scale);

  const h = destToSrcHomography(quad, outWidth, outHeight);
  if (!h) return null;

  const srcCtx = source.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return null;
  const srcData = srcCtx.getImageData(0, 0, source.width, source.height);
  const src = srcData.data;
  const srcW = source.width;
  const srcH = source.height;

  const out = document.createElement('canvas');
  out.width = outWidth;
  out.height = outHeight;
  const outCtx = out.getContext('2d');
  if (!outCtx) return null;
  const outData = outCtx.createImageData(outWidth, outHeight);
  const dst = outData.data;

  const [h0, h1, h2, h3, h4, h5, h6, h7] = h;

  for (let v = 0; v < outHeight; v++) {
    for (let u = 0; u < outWidth; u++) {
      const denom = h6 * u + h7 * v + 1;
      const sx = (h0 * u + h1 * v + h2) / denom;
      const sy = (h3 * u + h4 * v + h5) / denom;
      const di = (v * outWidth + u) * 4;

      if (sx < 0 || sy < 0 || sx >= srcW - 1 || sy >= srcH - 1) {
        dst[di] = dst[di + 1] = dst[di + 2] = 255;
        dst[di + 3] = 255;
        continue;
      }

      // Bilinear sample so edges and small text stay smooth.
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * srcW + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + srcW * 4;
      const i11 = i01 + 4;

      for (let c = 0; c < 3; c++) {
        const top = src[i00 + c] * (1 - fx) + src[i10 + c] * fx;
        const bottom = src[i01 + c] * (1 - fx) + src[i11 + c] * fx;
        dst[di + c] = top * (1 - fy) + bottom * fy;
      }
      dst[di + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return out;
}

/** In-place separable box blur using a sliding window (O(pixels) per pass). */
function boxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  const temp = new Float32Array(width * height * 3);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      let count = 0;
      for (let x = 0; x <= radius && x < width; x++) {
        sum += data[(y * width + x) * 4 + c];
        count++;
      }
      for (let x = 0; x < width; x++) {
        temp[(y * width + x) * 3 + c] = sum / count;
        const add = x + radius + 1;
        const remove = x - radius;
        if (add < width) {
          sum += data[(y * width + add) * 4 + c];
          count++;
        }
        if (remove >= 0) {
          sum -= data[(y * width + remove) * 4 + c];
          count--;
        }
      }
    }
  }

  // Vertical pass, writing back into the RGBA buffer
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      let count = 0;
      for (let y = 0; y <= radius && y < height; y++) {
        sum += temp[(y * width + x) * 3 + c];
        count++;
      }
      for (let y = 0; y < height; y++) {
        data[(y * width + x) * 4 + c] = sum / count;
        const add = y + radius + 1;
        const remove = y - radius;
        if (add < height) {
          sum += temp[(add * width + x) * 3 + c];
          count++;
        }
        if (remove >= 0) {
          sum -= temp[(remove * width + x) * 3 + c];
          count--;
        }
      }
    }
  }
}

/**
 * Clean up a document image.
 *
 * With `flatField`, each pixel is divided by a heavily blurred copy of itself,
 * which erases the lighting gradient and soft shadows a phone camera
 * introduces so paper reads as uniformly white while ink stays dark. Colour is
 * preserved per channel because logos matter on business cards.
 *
 * That division is only valid when the frame is (almost) entirely document —
 * run it over a photo that still contains a background and the sharp
 * card/background edge blooms into an ugly halo. So callers that could not
 * locate the card pass `flatField: false` and get a plain contrast curve,
 * which can never introduce artefacts.
 */
export function enhanceScan(
  canvas: HTMLCanvasElement,
  { flatField = true }: { flatField?: boolean } = {}
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const contrast = flatField ? 1.18 : 1.12;
  const lift = flatField ? 6 : 2;

  let background: Uint8ClampedArray | null = null;
  if (flatField) {
    background = new Uint8ClampedArray(pixels);
    boxBlur(background, width, height, Math.max(8, Math.round(Math.min(width, height) / 8)));
  }

  for (let i = 0; i < pixels.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let value = pixels[i + c];
      if (background) {
        value = (value / Math.max(background[i + c], 1)) * 255;
      }
      pixels[i + c] = (value - 128) * contrast + 128 + lift;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function toCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')?.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Produce a flattened, cleaned-up version of a photographed card.
 * `quad` is in pixel coordinates of the supplied image; when it is null the
 * image is only enhanced, not cropped.
 */
export async function scanDocument(dataUrl: string, quad: Quad | null): Promise<string> {
  const img = await loadImage(dataUrl);
  const source = toCanvas(img);

  const warped = quad ? warpPerspective(source, quad) : null;
  const target = warped ?? source;

  enhanceScan(target, { flatField: warped !== null });
  return target.toDataURL('image/jpeg', 0.92);
}
