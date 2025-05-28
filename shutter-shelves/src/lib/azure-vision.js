// src/lib/azure-vision.js
// Update for Azure OpenAI GPT-4 Turbo with Vision
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT; // e.g. https://YOUR-RESOURCE-NAME.openai.azure.com/
const AZURE_OPENAI_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT; // e.g. gpt-4-vision-preview
const AZURE_API_KEY = import.meta.env.VITE_AZURE_VISION_KEY;
const API_VERSION = '2024-02-15-preview';

export async function analyzeImageWithAzure(imageBase64) {
  const url = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
  const body = {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: `You are an intelligent culinary assistant tasked with analyzing a photo of pantry contents. Carefully identify each visible food item, including spices, canned goods, grains, sauces, snacks, and any other visible ingredients. After accurately listing these items, return your answer as a single JSON array of strings, with each string being a specific, quantitative ingredient. Do not include any text or explanation outside the JSON array.` },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }
    ],
    max_tokens: 300
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': AZURE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Azure OpenAI Vision API error: ' + res.status);
  return res.json();
}
