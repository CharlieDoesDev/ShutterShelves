// src/lib/azure-openai.js
// Use Azure OpenAI GPT-4 Turbo for recipe generation
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT; // e.g. https://YOUR-RESOURCE-NAME.openai.azure.com/
const AZURE_OPENAI_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT; // e.g. gpt-4-turbo
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
const API_VERSION = '2024-02-15-preview';

export async function getRecipesFromOpenAI(items) {
  const url = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
  const prompt = `Given ONLY these pantry ingredients (as a JSON array):\n${JSON.stringify(items)}\n\nSuggest up to five recipes. For each recipe, provide:\n- Title\n- Full list of ingredients (must be a subset of the pantry ingredients, do not add anything extra)\n- Step-by-step instructions\n\nReturn your answer as a JSON array of objects, each with 'title', 'ingredients' (array), and 'steps' (array of strings). Only output the array.`;
  const body = {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt }
        ]
      }
    ],
    max_tokens: 800
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': AZURE_OPENAI_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Azure OpenAI API error: ' + res.status);
  return res.json();
}
