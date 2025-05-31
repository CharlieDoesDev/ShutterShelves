import React from "react";
import DisplayRecipes from "../Recipe/DisplayRecipes";
import CenterPanel from "../SimpleContainers/CenterPanel";

export default function DisplayOutput({
  recipes,
  onNext,
  onSaveRecipe,
  savedRecipes,
}) {
  return (
    <div
      className="display-output"
      style={{
        textAlign: "left",
        maxWidth: 500,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
      }}
    >
      <CenterPanel>
        <h2 style={{ color: "#333" }}>Generated Recipes</h2>
        <DisplayRecipes
          recipes={recipes}
          onSaveRecipe={onSaveRecipe}
          savedRecipes={savedRecipes}
        />
        <button
          style={{
            marginTop: 24,
            padding: "0.5rem 2rem",
            fontSize: 16,
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
          onClick={onNext}
        >
          Next
        </button>
      </CenterPanel>
    </div>
  );
}
