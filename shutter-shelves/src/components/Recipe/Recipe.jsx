import React from "react";
import { parseRecipeInput } from "../../lib/recipeUtils";
import "./Recipe.css";

export default function Recipe({ recipe, isSaved, onSave }) {
  const parsed = parseRecipeInput(recipe);
  if (!parsed) return null;
  const { title = "Recipe", ingredients = [], steps = [], parseError } = parsed;
  return (
    <div className="recipe">
      {/* Star button for saving */}
      <button
        onClick={() => onSave && onSave(parsed)}
        className={`recipe-star-btn ${isSaved ? "saved" : "unsaved"}`}
        aria-label={isSaved ? "Saved" : "Save recipe"}
        title={isSaved ? "Saved" : "Save recipe"}
      >
        {isSaved ? "★" : "☆"}
      </button>
      <h3 className="recipe-title">{title}</h3>
      {parseError && (
        <div className="recipe-parse-error">
          Could not parse recipe details. Showing raw text.
        </div>
      )}
      <div className="recipe-ingredients">
        <strong>Ingredients:</strong>{" "}
        {Array.isArray(ingredients)
          ? ingredients.join(", ")
          : String(ingredients)}
      </div>
      <div className="recipe-steps">
        <strong>Steps:</strong>
        <ol>
          {Array.isArray(steps) ? (
            steps.map((step, idx) => <li key={idx}>{step}</li>)
          ) : (
            <li>{String(steps)}</li>
          )}
        </ol>
      </div>
    </div>
  );
}
