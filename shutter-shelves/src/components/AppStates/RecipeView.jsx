import React from "react";
import StyledButton from "../SimpleElements/StyledButton";
import { cleanGeminiJsonString } from "../../lib/recipeUtils";

export default function RecipeView({ recipe, onBack, isSaved, onSave }) {
  if (!recipe) return null;

  let parsedRecipe;
  try {
    // Clean and parse the recipe JSON
    const cleanedJson = cleanGeminiJsonString(JSON.stringify(recipe));
    parsedRecipe = JSON.parse(cleanedJson);
  } catch (error) {
    // Fallback to raw recipe text if parsing fails
    parsedRecipe = {
      title: "Invalid Recipe Format",
      rawText: JSON.stringify(recipe, null, 2),
    };
  }

  return (
    <div className="recipe-view">
      <StyledButton onClick={onBack}>Back to Cookbook</StyledButton>
      <h2>{parsedRecipe.title || "Untitled Recipe"}</h2>
      <div className="recipe-details">
        {parsedRecipe.ingredients ? (
          <>
            <h3>Ingredients</h3>
            <ul>
              {parsedRecipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </>
        ) : null}
        {parsedRecipe.instructions ? (
          <>
            <h3>Instructions</h3>
            <ol>
              {parsedRecipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </>
        ) : null}
        {parsedRecipe.rawText ? (
          <>
            <h3>Raw Recipe Data</h3>
            <pre>{parsedRecipe.rawText}</pre>
          </>
        ) : null}
      </div>
      {!isSaved && (
        <StyledButton onClick={() => onSave(recipe)}>
          Save to Cookbook
        </StyledButton>
      )}
    </div>
  );
}
