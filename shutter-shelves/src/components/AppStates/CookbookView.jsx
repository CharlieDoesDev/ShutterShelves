import React from "react";
import StyledButton from "../SimpleElements/StyledButton";
import DisplayRecipes from "../Recipe/DisplayRecipes";

export default function CookbookView({ recipes, onViewRecipe, onBack }) {
  return (
    <div className="cookbook-view">
      <h2>My Cookbook</h2>
      <StyledButton onClick={onBack}>Back</StyledButton>
      {recipes.length === 0 ? (
        <p>No saved recipes yet.</p>
      ) : (
        <DisplayRecipes recipes={recipes} onRecipeClick={onViewRecipe} />
      )}
    </div>
  );
}
