import React from "react";
import "./DisplayRecipes.css";

export default function DisplayRecipes({ recipes }) {
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
        <p key={idx} className="display-recipes-debug">
          {JSON.stringify(recipe, null, 2)}
        </p>
      ))}
    </div>
  );
}
