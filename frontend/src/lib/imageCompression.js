/**
 * Compresses an image file in the browser using the HTML5 Canvas API (completely free, client-side, zero external API keys or server fees).
 * Iteratively adjusts dimensions and JPEG quality to ensure the resulting Blob stays under maxSizeBytes.
 *
 * @param {File|Blob} file - The original image file
 * @param {number} maxSizeBytes - Target max size (default 2 MB: 2 * 1024 * 1024)
 * @returns {Promise<{ blob: Blob, file: File, wasCompressed: boolean }>}
 */
export async function compressImageUnderLimit(file, maxSizeBytes = 2 * 1024 * 1024) {
  // If file is already below limit, return it as is
  if (file.size <= maxSizeBytes) {
    return { blob: file, file, wasCompressed: false };
  }

  // Load image into an HTMLImageElement
  const bitmapUrl = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(new Error('Failed to load image for compression'));
    image.src = bitmapUrl;
  });

  URL.revokeObjectURL(bitmapUrl);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Max dimension bound to keep reasonable avatar aspect
  const MAX_DIMENSION = 1600;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    // Fill white background in case source image has transparency and we convert to jpeg
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }

  // Try encoding at decreasing quality levels until size <= maxSizeBytes
  let quality = 0.92;
  let resultBlob = null;

  while (quality >= 0.2) {
    resultBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });

    if (resultBlob && resultBlob.size <= maxSizeBytes) {
      break;
    }

    quality -= 0.15;
  }

  // If still too large after quality drop, scale down dimensions
  if (resultBlob && resultBlob.size > maxSizeBytes) {
    while (resultBlob.size > maxSizeBytes && width > 400 && height > 400) {
      width = Math.round(width * 0.75);
      height = Math.round(height * 0.75);
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }

      resultBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75);
      });
    }
  }

  if (!resultBlob) {
    throw new Error('Unable to compress image.');
  }

  const compressedFile = new File([resultBlob], (file.name || 'avatar.jpg').replace(/\.[^/.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
  });

  return { blob: resultBlob, file: compressedFile, wasCompressed: true };
}
