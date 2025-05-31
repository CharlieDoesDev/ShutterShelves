import React from "react";

export default function Recipe({ recipe }) {
  if (!recipe) return null;
  return (
    <div
      className="recipe"
      style={{
        marginBottom: 24,
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
          {recipe.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
