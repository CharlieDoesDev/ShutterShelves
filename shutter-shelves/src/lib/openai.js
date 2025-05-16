// shutter-shelves/src/lib/openai.js

const PROXY_URL = "https://pantry-pilot-proxy.shuttershells.workers.dev";

async function proxyPost(body) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

/**
 * Sends the image base64 to the Worker to extract pantry items.
 * @param {string} base64 - Base64-encoded image data.
 * @returns {Promise<string[]>} - Array of pantry item names.
 */
export function extractPantryItems(base64) {
  return proxyPost({ imageBase64: base64, mode: "items" });
}

/**
 * Sends the pantry items back to the Worker to get recipe suggestions.
 * @param {string[]} items
 * @returns {Promise<string[]>} - Array of recipe titles.
 */
export function getTopRecipes(items) {
  return proxyPost({ imageBase64: JSON.stringify(items), mode: "recipes" });
}
