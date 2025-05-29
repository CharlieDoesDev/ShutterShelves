// src/lib/azure-openai.js
// Use OpenAI GPT-4 Turbo for recipe generation (OpenAI, not Azure)
// Accept env as parameter for credentials
const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";

export async function getRecipesFromOpenAI(items, env) {
  const body = {
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'user',
        content: `Given ONLY these pantry ingredients (as a JSON array):\n${JSON.stringify(items)}\n\nSuggest up to five recipes. For each recipe, provide:\n- Title\n- Full list of ingredients (must be a subset of the pantry ingredients, do not add anything extra)\n- Step-by-step instructions\n\nReturn your answer as a JSON array of objects, each with 'title', 'ingredients' (array), and 'steps' (array of strings). Only output the array.`
      }
    ],
    max_tokens: 800
  };
  const res = await fetch(`${PROXY}/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('OpenAI API error: ' + res.status);
  return res.json();
}
