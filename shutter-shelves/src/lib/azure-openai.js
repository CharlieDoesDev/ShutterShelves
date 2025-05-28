// src/lib/azure-openai.js
// Use OpenAI GPT-4 Turbo for recipe generation (OpenAI, not Azure)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_VERSION = 'v1';

export async function getRecipesFromOpenAI(items) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = `Given ONLY these pantry ingredients (as a JSON array):\n${JSON.stringify(items)}\n\nSuggest up to five recipes. For each recipe, provide:\n- Title\n- Full list of ingredients (must be a subset of the pantry ingredients, do not add anything extra)\n- Step-by-step instructions\n\nReturn your answer as a JSON array of objects, each with 'title', 'ingredients' (array), and 'steps' (array of strings). Only output the array.`;
  const body = {
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 800
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('OpenAI API error: ' + res.status);
  return res.json();
}
