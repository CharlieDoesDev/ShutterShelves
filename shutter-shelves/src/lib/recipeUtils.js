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

/**
 * Remove all occurrences of a pattern from a string.
 * @param {string} str - The input string
 * @param {RegExp|string} pattern - The pattern to remove (RegExp or string)
 * @returns {string}
 */
export function removeAll(str, pattern) {
  if (!str) return str;
  if (typeof pattern === "string") {
    return str.split(pattern).join("");
  } else if (pattern instanceof RegExp) {
    return str.replace(pattern, ""); // Use the pattern as-is to preserve flags
  }
  return str;
}

/**
 * Aggressively clean a Gemini/AI JSON string by removing common unwanted patterns.
 * @param {string} raw - The raw string to clean
 * @returns {string}
 */
export function aggressiveGeminiClean(raw) {
  let str = raw;
  // Remove code block markers (triple backticks, with or without 'json')
  str = removeAll(str, /^```json\s*/gim); // opening code block
  str = removeAll(str, /```/g); // closing code block
  // Remove both escaped and real newlines
  str = removeAll(str, /\\n/g); // escaped newlines
  str = removeAll(str, /\r?\n/g); // actual newlines
  // Remove escaped quotes (but NOT all quotes)
  str = removeAll(str, /\\"/g); // escaped quotes
  // Remove stray 'Copy' and 'Edit' text
  str = removeAll(str, /Copy/g);
  str = removeAll(str, /Edit/g);
  // Remove outer quotes if present
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1);
  }
  return str.trim();
}

/**
 * Given a list of pantry items, generate a strict prompt for Gemini to return a single recipe as a JSON object.
 * @param {string[]} items - Pantry items
 * @returns {string} - The strict prompt
 */
export function getSingleRecipePrompt(items) {
  const template = {
    title: "...",
    ingredients: ["..."],
    instructions: ["..."],
  };
  return `Given these pantry items: ${items.join(
    ", "
  )}, generate ONE creative recipe as a minimal JSON object. Respond ONLY with a single JSON object, no markdown, no explanation, no code block, no extra text. The object should have only these fields: "title", "ingredients", and "instructions". Do not include any other fields or formatting. Use this exact template for your response: ${JSON.stringify(
    template,
    null,
    2
  )}`;
}

/**
 * Given a list of pantry items, generate prompts for Gemini to return N recipes, one per prompt.
 * @param {string[]} items - Pantry items
 * @param {number} n - Number of recipes
 * @returns {string[]} - Array of prompts
 */
export function getRecipePrompts(items, n) {
  const prompts = [];
  for (let i = 0; i < n; i++) {
    prompts.push(
      getSingleRecipePrompt(items) +
        ` This is recipe number ${
          i + 1
        } of ${n}. Make it unique and do not repeat any previous recipe.`
    );
  }
  return prompts;
}
