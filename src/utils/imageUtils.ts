/**
 * Downscale to fit within maxWidth/maxHeight and re-encode as JPEG.
 *
 * `quality` matters more than it looks: this same helper feeds both the copy
 * stored on the Firestore document (which must stay small — 1MB per doc, and a
 * card can carry two images) and the copy sent to OCR (which has to stay
 * legible). Those pull in opposite directions, so callers pass their own
 * numbers rather than sharing one compromise default.
 */
export const resizeImage = (
  base64Str: string, 
  maxWidth = 1000, 
  maxHeight = 1000,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};
