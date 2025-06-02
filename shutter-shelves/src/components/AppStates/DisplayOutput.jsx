// src/components/Recipe/DisplayOutput.jsx
import React from "react";
import DisplayRecipes from "../Recipe/DisplayRecipes";
import CenterPanel from "../SimpleContainers/CenterPanel";

export default function DisplayOutput({
  pantryItems = [],
  captions = [],
  parsedRecipes = [],
  error = null,
  onNext,
  onSaveRecipe,
  savedRecipes = [],
}) {
  const hasRecipes = Array.isArray(parsedRecipes) && parsedRecipes.length > 0;

  return (
    <div
      className="display-output"
      style={{
        textAlign: "left",
        maxWidth: 500,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
        color: "#333",
      }}
    >
      <CenterPanel>
        <h2>Generated Recipes</h2>

        {/* 1) If there was an error during processing, show it */}
        {error && (
          <div
            style={{
              background: "#fee",
              border: "1px solid #f99",
              padding: "1rem",
              borderRadius: 4,
              marginBottom: "1.5rem",
            }}
          >
            <strong style={{ color: "#900" }}>Error:</strong> {error}
          </div>
        )}

        {/* 2) Show which pantry items were detected (if any) */}
        {!error && pantryItems.length > 0 && (
          <div
            style={{
              background: "#f0f0f0",
              padding: "0.75rem",
              borderRadius: 4,
              marginBottom: "1rem",
            }}
          >
            <strong>Detected Pantry Items:</strong>
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {pantryItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3) Optionally show the raw captions from vision (if you want) */}
        {!error && captions.length > 0 && (
          <div style={{ marginBottom: "1rem", fontStyle: "italic" }}>
            <strong>Vision Captions:</strong>{" "}
            {captions.map((c, i) => (
              <div key={i} style={{ marginTop: "0.25rem" }}>
                • {c}
              </div>
            ))}
          </div>
        )}

        {/* 4) If there are valid recipes, hand them off to <DisplayRecipes> */}
        {!error && hasRecipes && (
          <>
            <DisplayRecipes
              recipes={parsedRecipes}
              onSaveRecipe={onSaveRecipe}
              savedRecipes={savedRecipes}
            />
          </>
        )}

        {/* 5) If there were no errors, but also no recipes, show a fallback */}
        {!error && !hasRecipes && (
          <div style={{ marginTop: "1rem", color: "#666" }}>
            <p>No valid recipes generated. Try different images or check your inputs.</p>
          </div>
        )}

        {/* 6) Always show the “Next” button (or hide it until something is done) */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            style={{
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
        </div>
      </CenterPanel>
    </div>
  );
}
