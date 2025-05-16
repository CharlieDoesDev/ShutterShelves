// src/lib/openai.js
const PROXY_URL = "https://pantry-pilot-proxy.shuttershells.workers.dev";

async function proxyPost(body) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }
  return res.json();
}

export function extractPantryItems(base64) {
  return proxyPost({ imageBase64: base64, mode: "items" });
}

export function getTopRecipes(items) {
  return proxyPost({ imageBase64: JSON.stringify(items), mode: "recipes" });
}