import React from "react";

export default function Recipe({ recipe, isSaved, onSave }) {
  if (!recipe) return null;
  // If recipe is a string, try to parse as JSON
  let parsed = recipe;
  if (typeof recipe === "string") {
    try {
      parsed = JSON.parse(recipe);
    } catch {
      parsed = { title: "Recipe", ingredients: [], steps: [recipe] };
    }
  }
  // Fallbacks for missing fields
  const title = parsed.title || "Recipe";
  const ingredients = parsed.ingredients || [];
  const steps = parsed.steps || parsed.instructions || [];
  return (
    <div
      className="recipe"
      style={{
        marginBottom: 24,
        padding: 16,
        background: "#f8fafc",
        borderRadius: 8,
        boxShadow: "0 1px 4px #0001",
        position: "relative",
      }}
    >
      {/* Star button for saving */}
      <button
        onClick={() => onSave && onSave(parsed)}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 28,
          color: isSaved ? "#facc15" : "#d1d5db",
          transition: "color 0.2s",
        }}
        aria-label={isSaved ? "Saved" : "Save recipe"}
        title={isSaved ? "Saved" : "Save recipe"}
      >
        {isSaved ? "★" : "☆"}
      </button>
      <h3 style={{ margin: 0, color: "#2563eb" }}>{title}</h3>
      <div>
        <strong>Ingredients:</strong> {Array.isArray(ingredients) ? ingredients.join(", ") : String(ingredients)}
      </div>
      <div>
        <strong>Steps:</strong>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {Array.isArray(steps)
            ? steps.map((step, idx) => <li key={idx}>{step}</li>)
            : <li>{String(steps)}</li>}
        </ol>
      </div>
    </div>
  );
}
