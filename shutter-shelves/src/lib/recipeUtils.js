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
