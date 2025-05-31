// Handles Gemini-specific processing results and recipe parsing
function extractJsonArrayFromText(text) {
  // Match a code block with json or just a JSON array/object in the text
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) return arrMatch[0];
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return null;
}

export function processGeminiResults({
  pantryItems,
  recipesText,
  images,
  parsedRecipes,
}) {
  let resultImages = images || [];
  let finalRecipes;
  if (
    parsedRecipes &&
    Array.isArray(parsedRecipes) &&
    parsedRecipes.length > 0
  ) {
    finalRecipes = parsedRecipes;
  } else {
    let jsonStr = extractJsonArrayFromText(recipesText);
    try {
      if (jsonStr) {
        finalRecipes = JSON.parse(jsonStr);
        if (!Array.isArray(finalRecipes)) finalRecipes = [finalRecipes];
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      finalRecipes = [
        {
          title: "Recipes",
          ingredients: pantryItems || [],
          steps: [recipesText],
        },
      ];
    }
  }
  return { images: resultImages, recipes: finalRecipes };
}
