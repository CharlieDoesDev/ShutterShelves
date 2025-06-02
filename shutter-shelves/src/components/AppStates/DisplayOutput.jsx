// src/components/Recipe/DisplayOutput.jsx
import React from "react";
import DisplayRecipes from "../Recipe/DisplayRecipes";
import CenterPanel from "../SimpleContainers/CenterPanel";

export default function DisplayOutput({
  pantryItems = [],
  captions = [],
  parsedRecipes = null,   // null until real data arrives
  rawAttempts = [],       // for debug when parseErrors occur
  error = null,
  onNext,
  onSaveRecipe,
  savedRecipes = [],
}) {
  // 1. If still “waiting to start” (parsedRecipes === null), show a Start button
  if (parsedRecipes === null && !error) {
    return (
      <CenterPanel>
        <button
          style={{
            padding: "0.75rem 2rem",
            fontSize: 16,
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
          onClick={onNext}
        >
          Start
        </button>
      </CenterPanel>
    );
  }

  // 2. Otherwise, show the results (or errors)
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

        {/* A. Fatal error */}
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

        {/* B. Show detected pantry items, if any */}
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

        {/* C. (Optional) Show raw “captions” if you ever want them */}
        {!error && captions.length > 0 && (
          <div style={{ marginBottom: "1rem", fontStyle: "italic" }}>
            <strong>Vision Captions:</strong>
            {captions.map((c, i) => (
              <div key={i} style={{ marginTop: "0.25rem" }}>
                • {c}
              </div>
            ))}
          </div>
        )}

        {/* D. If we have at least one valid recipe, render via <DisplayRecipes> */}
        {!error &&
          Array.isArray(parsedRecipes) &&
          parsedRecipes.length > 0 && (
            <DisplayRecipes
              recipes={parsedRecipes}
              onSaveRecipe={onSaveRecipe}
              savedRecipes={savedRecipes}
            />
          )}

        {/* E. If no recipes but no parse-attempts at all, show fallback */}
        {!error &&
          Array.isArray(parsedRecipes) &&
          parsedRecipes.length === 0 &&
          rawAttempts.length === 0 && (
            <div style={{ marginTop: "1rem", color: "#666" }}>
              <p>No valid recipes generated. Try different images or check your inputs.</p>
            </div>
          )}

        {/* F. If all attempts failed to parse, show each attempt’s error details */}
        {!error &&
          Array.isArray(parsedRecipes) &&
          parsedRecipes.length === 0 &&
          rawAttempts.length > 0 && (
            <div style={{ marginTop: "1rem", color: "#900" }}>
              <p>
                <strong>All recipe attempts failed to parse:</strong>
              </p>
              {rawAttempts.map((attempt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#fee",
                    padding: "0.5rem",
                    borderRadius: 4,
                    marginBottom: "0.75rem",
                  }}
                >
                  <p>
                    <strong>Attempt #{idx + 1}:</strong>{" "}
                    {attempt.title || "Recipe Parse Error"}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    {Array.isArray(attempt.steps) ? (
                      attempt.steps.map((line, i) => <li key={i}>{line}</li>)
                    ) : (
                      <li>{String(attempt.steps)}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}

        {/* G. “Next” button at the bottom */}
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
