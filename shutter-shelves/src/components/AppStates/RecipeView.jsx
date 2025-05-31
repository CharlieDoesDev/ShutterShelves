import React from "react";
import StyledButton from "../SimpleElements/StyledButton";

export default function RecipeView({ recipe, onBack, isSaved, onSave }) {
  if (!recipe) return null;
  return (
    <div className="recipe-view">
      <StyledButton onClick={onBack}>Back to Cookbook</StyledButton>
      <h2>{recipe.title}</h2>
      <div className="recipe-details">
        <h3>Ingredients</h3>
        <ul>
          {recipe.ingredients &&
            recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
        <h3>Instructions</h3>
        <ol>
          {recipe.instructions &&
            recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </div>
      {!isSaved && (
        <StyledButton onClick={() => onSave(recipe)}>
          Save to Cookbook
        </StyledButton>
      )}
    </div>
  );
}
