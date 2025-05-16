// src/lib/openai.js
const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";

async function post(path, body) {
  const res = await fetch(`${PROXY}${path}`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Proxy ${path} error ${res.status}: ${text}`);
  return JSON.parse(text);
}

export const extractPantryItems = (base64) =>
  post("/pantry", { imageBase64: base64 });

export const getTopRecipes = (items) =>
  post("/recipes", { items });
