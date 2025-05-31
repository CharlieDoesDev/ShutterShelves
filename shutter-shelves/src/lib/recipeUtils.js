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

/**
 * If a recipe object has a 'steps' field that is a single string containing a JSON array (with triple-backticks etc),
 * this will parse and replace it with the actual array of objects.
 * @param {object} recipe - The recipe object to fix
 * @returns {object} - The fixed recipe object
 */
export function fixStepsField(recipe) {
  if (!recipe || !Array.isArray(recipe.steps)) return recipe;
  // If steps is a single string and looks like a JSON array, try to parse it
  if (recipe.steps.length === 1 && typeof recipe.steps[0] === "string") {
    let stepsStr = recipe.steps[0].trim();
    // Remove triple-backtick and json markers
    stepsStr = stepsStr.replace(/^```json\s*/i, "").replace(/```$/i, "");
    // Remove outer quotes if present
    if (stepsStr.startsWith('"') && stepsStr.endsWith('"')) {
      stepsStr = stepsStr.slice(1, -1);
    }
    // Unescape inner quotes
    stepsStr = stepsStr.replace(/\\"/g, '"');
    // Replace \n with real line breaks or remove
    stepsStr = stepsStr.replace(/\\n/g, "");
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(stepsStr);
      if (Array.isArray(parsed)) {
        return { ...recipe, steps: parsed };
      }
    } catch (e) {
      // If parsing fails, leave as is
    }
  }
  return recipe;
}
