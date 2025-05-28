// src/lib/azure-vision.js
const AZURE_VISION_ENDPOINT = 'https://shuttershelvesvision.cognitiveservices.azure.com/';
const AZURE_API_KEY = import.meta.env.VITE_AZURE_VISION_KEY;

export async function analyzeImageWithAzure(imageBase64) {
  // Azure expects binary, so convert base64 to blob
  const byteCharacters = atob(imageBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });

  const res = await fetch(AZURE_VISION_ENDPOINT + '?visualFeatures=Description,Tags', {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: blob,
  });
  if (!res.ok) throw new Error('Azure Vision API error: ' + res.status);
  return res.json();
}
