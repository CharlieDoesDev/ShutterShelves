// src/lib/recipeUtils.js
export function parseRecipeInput(recipeInput) {
  if (!recipeInput) return null;
  if (typeof recipeInput === "object") {
    return normalizeRecipe(recipeInput);
  }

  // Clean the input string first
  let cleanedInput = aggressiveGeminiClean(recipeInput);

  // Try direct JSON parse with cleaned input
  try {
    const parsed = JSON.parse(cleanedInput);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeRecipe)[0] || createErrorRecipe("Empty recipe array");
    }
    return normalizeRecipe(parsed);
  } catch (e) {
    // Try to extract JSON from text
    try {
      // Look for array of recipes first
      const arrayMatch = cleanedInput.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const array = JSON.parse(arrayMatch[0]);
        return array.map(normalizeRecipe)[0] || createErrorRecipe("Empty recipe array");
      }

      // Try single recipe object
      const objMatch = cleanedInput.match(/\{[\s\S]*\}/);
      if (objMatch) {
        return normalizeRecipe(JSON.parse(objMatch[0]));
      }
    } catch {
      // If all parsing fails, return error recipe with cleaned text
      return createErrorRecipe(cleanedInput);
    }
  }
  return createErrorRecipe(cleanedInput);
}

function normalizeRecipe(recipe) {
  if (!recipe || typeof recipe !== 'object') {
    return createErrorRecipe("Invalid recipe format");
  }

  // Normalize fields
  const normalized = {
    title: recipe.title || "Untitled Recipe",
    ingredients: [],
    steps: []
  };

  // Handle ingredients
  if (recipe.ingredients) {
    normalized.ingredients = Array.isArray(recipe.ingredients) 
      ? recipe.ingredients 
      : [recipe.ingredients];
  }

  // Handle steps/instructions
  const instructions = recipe.instructions || recipe.steps;
  if (instructions) {
    normalized.steps = Array.isArray(instructions)
      ? instructions
      : [instructions];
  }

  return normalized;
}

function createErrorRecipe(errorText) {
  return {
    title: "Recipe Parse Error",
    ingredients: [],
    steps: [errorText],
    parseError: true
  };
}

/**
 * Aggressively clean a Gemini/AI JSON string by removing common unwanted patterns.
 * @param {string} raw - The raw string to clean
 * @returns {string} - Cleaned JSON string
 */
export function aggressiveGeminiClean(raw) {
  if (!raw) return "";
  let str = raw.toString().trim();

  // First pass: Basic cleanup
  str = str
    // Remove markdown code blocks
    .replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1")
    // Remove stray backticks
    .replace(/`/g, '')
    // Fix escaped quotes and slashes
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    // Convert escaped newlines to spaces
    .replace(/\\n/g, ' ')
    // Remove actual newlines and excess whitespace
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ');

  // Second pass: Fix array and object formatting
  str = str
    // Fix array formations
    .replace(/\[\s*\{/g, '[{')
    .replace(/\}\s*\]/g, '}]')
    .replace(/\}\s*,\s*\{/g, '},{')
    // Remove any text outside of valid JSON structure
    .replace(/^[^[\{]*([\[\{][\s\S]*[\}\]])[^[\{]*$/, '$1')
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing quotes around property names
    .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');

  // Final pass: Additional JSON structure fixes
  str = str
    // Ensure arrays of strings have quotes
    .replace(/\[(([^"'\[\]]*,?\s*)*)\]/g, (match, contents) => {
      if (!contents.trim()) return '[]';
      return '[' + contents.split(',')
        .map(item => item.trim())
        .filter(item => item)
        .map(item => item.startsWith('"') ? item : `"${item}"`)
        .join(',') + ']';
    })
    // Remove any remaining invalid characters
    .replace(/(["\]}])([^\s,"\]}])+/g, '$1')
    .replace(/([^\s,"\[{])+(["[{])/g, '$2');

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
