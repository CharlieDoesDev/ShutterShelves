// src/lib/openai.js

const endpoint = import.meta.env.VITE_AOAI_ENDPOINT;
const deployment = import.meta.env.VITE_AOAI_DEPLOYMENT;
const apiVersion = import.meta.env.VITE_AOAI_API_VERSION;
const apiKey = import.meta.env.VITE_AOAI_KEY;

async function callChat(messages, maxTokens = 200, temperature = 0) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }
  const { choices } = await res.json();
  return choices[0].message.content;
}

export async function extractPantryItems(imageBase64, mimeType) {
  const system = 'Extract pantry item names from this image.';
  const user = { role: 'user', content: imageBase64, contentType: mimeType };
  const content = await callChat([{ role: 'system', content: system }, user], 200, 0);
  return JSON.parse(content);
}

export async function getTopRecipes(items) {
  const system =
    'Given a JSON array of pantry items, return a JSON array of up to five recipe titles that can be made with those items.';
  const user = { role: 'user', content: JSON.stringify(items) };
  const content = await callChat([{ role: 'system', content: system }, user], 150, 0.7);
  return JSON.parse(content);
}
