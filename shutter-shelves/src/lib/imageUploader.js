// src/lib/imageUploader.js
// Utility functions for image uploading/processing and UI logic

/**
 * Reads a File object as a data URL (base64)
 * @param {File} file
 * @returns {Promise<{base64: string, dataUrl: string}>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, dataUrl });
    };
    reader.onerror = reject;
  });
}

/**
 * Handles the full image upload flow: file selection, base64 conversion, and callback.
 * @param {File} file
 * @param {Function} onAzureVision - callback to process the image (base64)
 * @param {boolean} appendMode
 * @returns {Promise<{dataUrl: string}|null>}
 */
export async function handleImageUpload(file, onAzureVision, appendMode) {
  if (!file) return null;
  const { base64, dataUrl } = await readFileAsBase64(file);
  if (onAzureVision) {
    await onAzureVision(base64, appendMode);
  }
  return { dataUrl };
}
