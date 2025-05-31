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
 * Supports single or multiple files, and returns an array of { dataUrl, base64 } objects.
 * @param {FileList|File|File[]} fileOrFiles
 * @returns {Promise<Array<{dataUrl: string, base64: string}>>}
 */
export async function handleImageUpload(fileOrFiles) {
  if (!fileOrFiles) return [];
  // Accept FileList, single File, or array of Files
  let files = [];
  if (Array.isArray(fileOrFiles)) {
    files = fileOrFiles;
  } else if (fileOrFiles instanceof FileList) {
    files = Array.from(fileOrFiles);
  } else if (fileOrFiles instanceof File) {
    files = [fileOrFiles];
  }
  // Filter out any non-File objects
  files = files.filter((f) => f instanceof File);
  if (!files.length) return [];
  // Always return a flat array of { dataUrl, base64 } for compatibility with App.jsx
  const results = await Promise.all(
    files.map(async (file) => {
      const { base64, dataUrl } = await readFileAsBase64(file);
      return { dataUrl, base64 };
    })
  );
  return results;
}
