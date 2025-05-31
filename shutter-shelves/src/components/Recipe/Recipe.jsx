import React from "react";

function extractFirstRecipe(str) {
  // Try to extract the first JSON object or array from a string
  const objMatch = str.match(/\{[\s\S]*?\}/);
  const arrMatch = str.match(/\[[\s\S]*?\]/);
  let jsonStr = null;
  if (arrMatch) {
    jsonStr = arrMatch[0];
  } else if (objMatch) {
    jsonStr = objMatch[0];
  }
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed[0] || null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

export default function Recipe({ recipe, isSaved, onSave }) {
  if (!recipe) return null;
  let parsed = recipe;
  let parseError = false;
  if (typeof recipe === "string") {
    // Try direct JSON parse first
    try {
      const direct = JSON.parse(recipe);
      parsed = Array.isArray(direct) ? direct[0] || {} : direct;
    } catch {
      // Try to extract JSON from text
      const extracted = extractFirstRecipe(recipe);
      if (extracted) {
        parsed = extracted;
      } else {
        parseError = true;
        parsed = { title: "Recipe", ingredients: [], steps: [recipe] };
      }
    }
  }
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
      {parseError && (
        <div style={{ color: "#b91c1c", marginBottom: 8 }}>
          Could not parse recipe details. Showing raw text.
        </div>
      )}
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
