// src/components/Recipe/DisplayOutput.jsx
import React from "react";
import DisplayRecipes from "../Recipe/DisplayRecipes";
import CenterPanel from "../SimpleContainers/CenterPanel";

export default function DisplayOutput({
  pantryItems = [],
  captions = [],
  parsedRecipes = null,   // ← Start as null until real data arrives
  rawAttempts = [],       // ← Optional: if you want to show parse‐error details
  error = null,
  onNext,
  onSaveRecipe,
  savedRecipes = [],
}) {
  // If we haven’t received “parsedRecipes” yet, show a “Start” button or a spinner
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

  // Once parsedRecipes is [] or [ …some recipe objects… ], we render the UI below:
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

        {/* 1. If there was a fatal error, show it */}
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

        {/* 2. Show detected pantry items, if any */}
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

        {/* 3. (Optional) Show raw “captions” from the vision API, so you can verify what it saw */}
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

        {/* 4. If we have at least one valid recipe, render it via <DisplayRecipes> */}
        {!error && Array.isArray(parsedRecipes) && parsedRecipes.length > 0 && (
          <DisplayRecipes
            recipes={parsedRecipes}
            onSaveRecipe={onSaveRecipe}
            savedRecipes={savedRecipes}
          />
        )}

        {/* 5. If there were no parse‐errors but parsedRecipes is an empty array, show a “no recipes” message */}
        {!error && Array.isArray(parsedRecipes) && parsedRecipes.length === 0 && (
          <div style={{ marginTop: "1rem", color: "#666" }}>
            <p>No valid recipes generated. Try different images or check your inputs.</p>
          </div>
        )}

        {/* 6. If all attempts failed to parse (parsedRecipes === [] but rawAttempts is non‐empty),
             show each attempt’s “steps” array so you can debug. */}
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
                    {Array.isArray(attempt.steps)
                      ? attempt.steps.map((line, i) => <li key={i}>{line}</li>)
                      : <li>{String(attempt.steps)}</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}

        {/* 7. “Next” button at the bottom, always visible once we've loaded */}
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
