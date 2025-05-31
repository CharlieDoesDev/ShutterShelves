import React from "react";

export default function DisplayOutput({ recipes }) {
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
      <h2 style={{ color: "#333" }}>Generated Recipes</h2>
      {recipes && recipes.length > 0 ? (
        recipes.map((recipe, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 32,
              padding: 16,
              background: "#f8fafc",
              borderRadius: 8,
              boxShadow: "0 1px 4px #0001",
            }}
          >
            <h3 style={{ margin: 0, color: "#2563eb" }}>{recipe.title}</h3>
            <div>
              <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
            </div>
            <div>
              <strong>Steps:</strong>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {recipe.steps.map((step, sidx) => (
                  <li key={sidx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        ))
      ) : (
        <div>No recipes generated.</div>
      )}
    </div>
  );
}
