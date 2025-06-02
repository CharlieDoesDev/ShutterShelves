// src/lib/recipeUtils.js

/**
 * Attempt to parse a Gemini/AI response into a single normalized recipe object.
 * Returns null on empty input, or a "Recipe Parse Error" object if parsing fails.
 */
export function parseRecipeInput(recipeInput) {
  if (!recipeInput) return null;
  if (typeof recipeInput === "object") {
    return normalizeRecipe(recipeInput);
  }

  const cleaned = aggressiveGeminiClean(recipeInput);

  // 1. Try direct JSON.parse on the cleaned string
  try {
    const parsed = JSON.parse(cleaned);
    return getFirstValidRecipe(parsed);
  } catch {
    // 2. Fallback: extract a balanced JSON block from the raw or cleaned text
    const jsonText =
      extractTopLevel(recipeInput) || extractTopLevel(cleaned);
    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        return getFirstValidRecipe(parsed);
      } catch {
        return createErrorRecipe("JSON extraction failed");
      }
    }
    return createErrorRecipe(cleaned);
  }
}

/**
 * If parsed is an array, normalize each entry and return the first valid recipe.
 * If parsed is an object, normalize it directly.
 */
function getFirstValidRecipe(parsed) {
  if (Array.isArray(parsed)) {
    const validRecipes = parsed
      .map(normalizeRecipe)
      .filter((r) => !r.parseError);
    return validRecipes[0] || createErrorRecipe("Empty or invalid recipe array");
  }
  return normalizeRecipe(parsed);
}

/**
 * Extracts the first balanced JSON object or array from a string by counting braces/brackets.
 * Returns the substring including matching braces/brackets, or null if none found.
 */
function extractTopLevel(text) {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;
  let openingChar = "";

  if (firstBrace === -1 && firstBracket === -1) {
    return null;
  }
  if (firstBrace === -1 || (firstBracket !== -1 && firstBracket < firstBrace)) {
    startIdx = firstBracket;
    openingChar = "[";
  } else {
    startIdx = firstBrace;
    openingChar = "{";
  }

  const closingChar = openingChar === "{" ? "}" : "]";
  let depth = 0;

  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "{" || text[i] === "[") depth++;
    if (text[i] === "}" || text[i] === "]") depth--;
    if (depth === 0) {
      return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

/**
 * Ensure the recipe object has the shape { title, ingredients[], steps[] }.
 * If the input is invalid, return a parse-error object.
 */
function normalizeRecipe(recipe) {
  if (!recipe || typeof recipe !== "object") {
    return createErrorRecipe("Invalid recipe format");
  }

  const normalized = {
    title: recipe.title || "Untitled Recipe",
    ingredients: [],
    steps: [],
  };

  if (recipe.ingredients) {
    normalized.ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [recipe.ingredients];
  }

  const instructions = recipe.instructions || recipe.steps;
  if (instructions) {
    normalized.steps = Array.isArray(instructions)
      ? instructions
      : [instructions];
  }

  return normalized;
}

/**
 * Returns a special object marking a parse error.
 */
function createErrorRecipe(errorText) {
  return {
    title: "Recipe Parse Error",
    ingredients: [],
    steps: [errorText],
    parseError: true,
  };
}

/**
 * Light cleaning of common Gemini/AI JSON formatting issues:
 *  - removes Markdown code fences
 *  - strips surrounding quotes
 *  - unescapes \" inside strings
 * Does not collapse all whitespace to a single space, preserving valid JSON formatting.
 */
export function aggressiveGeminiClean(raw) {
  if (!raw) return "";
  let str = raw.toString().trim();

  // Remove JSON code fences
  str = str.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1");
  // Strip surrounding quotes if the entire string is quoted
  str = str.replace(/^"([\s\S]*)"$/, "$1");
  // Unescape any \" sequences
  str = str.replace(/\\"/g, '"');

  return str.trim();
}

/**
 * Given a list of pantry items, generate a strict prompt for one recipe.
 */
export function getSingleRecipePrompt(items) {
  const template = {
    title: "...",
    ingredients: ["..."],
    instructions: ["..."],
  };
  return `Given these pantry items: ${items.join(
    ", "
  )}, generate ONE creative recipe as a minimal JSON object. Respond ONLY with a single JSON object, no markdown, no explanation, no code block, no extra text. The object should have only these fields: "title", "ingredients", and "instructions". Use this exact template for your response: ${JSON.stringify(
    template,
    null,
    2
  )}`;
}

/**
 * Given a list of pantry items and a number n, generate n distinct prompts.
 */
export function getRecipePrompts(items, n) {
  const prompts = [];
  for (let i = 0; i < n; i++) {
    prompts.push(
      getSingleRecipePrompt(items) +
        ` This is recipe number ${i + 1} of ${n}. Make it unique and do not repeat any previous recipe.`
    );
  }
  return prompts;
}
