import React from "react";
import Recipe from "./Recipe";

export default function DisplayRecipes({ recipes, onSaveRecipe, savedRecipes }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div style={{ color: "#888", textAlign: "center" }}>
        No recipes to display.
      </div>
    );
  }
  return (
    <div
      className="display-recipes"
      style={{ maxWidth: 500, margin: "0 auto" }}
    >
      {recipes.map((recipe, idx) => (
        <Recipe
          key={idx}
          recipe={recipe}
          isSaved={savedRecipes && savedRecipes.some(r => r.title === (recipe.title || (typeof recipe === 'string' ? recipe : '')))}
          onSave={onSaveRecipe}
        />
      ))}
    </div>
  );
}
