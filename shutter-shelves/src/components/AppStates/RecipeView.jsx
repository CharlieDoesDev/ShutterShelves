// src/components/Recipe/RecipeView.jsx
import React from "react";
import StyledButton from "../SimpleElements/StyledButton";

export default function RecipeView({ recipe, onBack, isSaved, onSave }) {
  if (!recipe) return null;

  // Destructure expected fields, with sensible defaults
  const {
    title = "Untitled Recipe",
    ingredients = [],
    steps = [],
  } = recipe;

  return (
    <div className="recipe-view">
      <StyledButton onClick={onBack}>Back to Cookbook</StyledButton>

      <h2>{title}</h2>

      <div className="recipe-details">
        {ingredients.length > 0 && (
          <>
            <h3>Ingredients</h3>
            <ul>
              {ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </>
        )}

        {steps.length > 0 && (
          <>
            <h3>Instructions</h3>
            <ol>
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </>
        )}

        {/* If no ingredients or steps exist, show a placeholder */}
        {ingredients.length === 0 && steps.length === 0 && (
          <p style={{ fontStyle: "italic", color: "#666" }}>
            No detailed recipe data available.
          </p>
        )}
      </div>

      {!isSaved && (
        <StyledButton onClick={() => onSave(recipe)}>
          Save to Cookbook
        </StyledButton>
      )}
    </div>
  );
}
