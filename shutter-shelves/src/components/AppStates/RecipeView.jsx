import React from "react";
import StyledButton from "../SimpleElements/StyledButton";
import { aggressiveGeminiClean } from "../../lib/recipeUtils";

export default function RecipeView({ recipe, onBack, isSaved, onSave }) {
  if (!recipe) return null;

  let parsedRecipe;
  try {
    // Clean and parse the recipe JSON
    const cleanedJson = aggressiveGeminiClean(JSON.stringify(recipe));
    parsedRecipe = JSON.parse(cleanedJson);

    // Normalize the recipe structure
    parsedRecipe = {
      title: parsedRecipe.title || "Untitled Recipe",
      ingredients: Array.isArray(parsedRecipe.ingredients)
        ? parsedRecipe.ingredients
        : [],
      steps: parsedRecipe.instructions || parsedRecipe.steps || [],
    };
  } catch (error) {
    // Fallback to raw recipe text if parsing fails
    parsedRecipe = {
      title: "Invalid Recipe Format",
      ingredients: [],
      steps: [
        typeof recipe === "string"
          ? recipe
          : JSON.stringify(recipe, null, 2),
      ],
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
        {parsedRecipe.steps ? (
          <>
            <h3>Instructions</h3>
            <ol>
              {parsedRecipe.steps.map((step, i) => (
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
