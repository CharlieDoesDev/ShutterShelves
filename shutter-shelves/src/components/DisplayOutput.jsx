import React from "react";
import {
  generateAnalysis,
  generateRecipes,
  removeImage,
  handleReset,
  onFileChange,
  DemoImageRequest,
} from "../lib/Util.js";

export default function DisplayOutput({ images }) {
  // Gather debug info from Util functions
  const analysis = generateAnalysis();
  const recipes = generateRecipes(analysis);
  const removed = removeImage(images, 0);
  const reset = handleReset();
  // onFileChange and DemoImageRequest are async and need events/data, so just show their function signatures

  return (
    <div
      className="display-output"
      style={{ textAlign: "left", fontFamily: "monospace", fontSize: 14 }}
    >
      <h2>Debug Info from Util.js</h2>
      <pre>
        {JSON.stringify(
          {
            generateAnalysis: analysis,
            generateRecipes: recipes,
            removeImage: removed,
            handleReset: reset,
            onFileChange: onFileChange.toString().slice(0, 60) + "...",
            DemoImageRequest: DemoImageRequest.toString().slice(0, 60) + "...",
          },
          null,
          2
        )}
      </pre>
      <div style={{ marginTop: 24, color: "#888" }}>
        Images prop: {JSON.stringify(images)}
      </div>
    </div>
  );
}
