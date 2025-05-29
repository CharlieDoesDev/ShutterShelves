// src/lib/azure-openai.js
// Use OpenAI GPT-4 Turbo for recipe generation (OpenAI, not Azure)
// Accept env as parameter for credentials
const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";

export async function getRecipesFromOpenAI(items, env) {
  // Use Gemini completion endpoint via proxy
  const res = await fetch(`${PROXY}/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.status);
  return res.json(); // { completion: string }
}
