// src/lib/recipeUtils.js
export function parseRecipeInput(recipeInput) {
  if (!recipeInput) return null;
  if (typeof recipeInput === "object") return recipeInput;

  // Try direct JSON parse
  try {
    const direct = JSON.parse(recipeInput);
    return Array.isArray(direct) ? direct[0] || {} : direct;
  } catch {
    // Try to extract JSON from text
    const objMatch = recipeInput.match(/\{[\s\S]*?\}/);
    const arrMatch = recipeInput.match(/\[[\s\S]*?\]/);
    let jsonStr = arrMatch ? arrMatch[0] : objMatch ? objMatch[0] : null;
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed[0] || {} : parsed;
      } catch {
        // fall through
      }
    }
    // Fallback: treat as plain text
    return {
      title: "Recipe",
      ingredients: [],
      steps: [recipeInput],
      parseError: true,
    };
  }
}

/**
 * Cleans Gemini's JSON output by removing triple-backtick blocks, outer quotes, unescaping inner quotes, and removing \n.
 * @param {string} raw - The raw string from Gemini
 * @returns {string} - Cleaned JSON string
 */
export function cleanGeminiJsonString(raw) {
  if (!raw) return raw;
  let str = raw.trim();
  // Remove opening and closing triple-backtick blocks
  str = str.replace(/^```json\s*/i, "").replace(/```$/i, "");
  // Remove outer quotes if present
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1);
  }
  // Unescape inner quotes
  str = str.replace(/\\"/g, '"');
  // Replace \n with real line breaks or remove
  str = str.replace(/\\n/g, "");
  return str;
}
