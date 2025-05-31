// src/lib/imageProcessing.js
// Utility for cycling downsampling and applying it to a data URL image

const DOWNSAMPLE_FACTORS = [0.25, 0.5, 0.75, 0.85, 0.95, 1];

/**
 * Returns the next downsample factor in the cycle.
 * @param {number} current Current factor (e.g. 0.5)
 * @returns {number} Next factor
 */
export function getNextDownsampleFactor(current) {
  const idx = DOWNSAMPLE_FACTORS.indexOf(current);
  return DOWNSAMPLE_FACTORS[(idx + 1) % DOWNSAMPLE_FACTORS.length];
}

/**
 * Downsamples a data URL image by the given factor.
 * @param {string} dataUrl
 * @param {number} factor (0 < factor <= 1)
 * @returns {Promise<string>} Downsampled data URL
 */
export async function downsampleDataUrl(dataUrl, factor) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      const w = Math.max(1, Math.round(img.width * factor));
      const h = Math.max(1, Math.round(img.height * factor));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export { DOWNSAMPLE_FACTORS };
