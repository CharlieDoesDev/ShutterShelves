// Handles Gemini-specific processing results and recipe parsing
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
    try {
      finalRecipes = JSON.parse(recipesText);
      if (!Array.isArray(finalRecipes)) finalRecipes = [finalRecipes];
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
