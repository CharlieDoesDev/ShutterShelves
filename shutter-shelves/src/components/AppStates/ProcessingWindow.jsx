import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";

export default function ProcessingWindow({ images, onDone, onProcessed }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function processImages() {
      // Show progress bar while processing
      asyncProgressBar((p) => {
        if (!cancelled) setProgress(p);
      });
      // After progress bar, call Gemini API
      try {
        // Import Gemini logic from CameraWindow (refactor if needed)
        const { dataUrlToBase64Object } = await import("../../lib/imageUploader");
        const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";
        const base64Array = images.map(photo => dataUrlToBase64Object(photo.dataUrl).base64);
        const pantryRes = await fetch(`${PROXY}/pantry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagesBase64: base64Array }),
        });
        if (!pantryRes.ok) throw new Error("Gemini pantry error: " + pantryRes.status);
        const pantryItems = await pantryRes.json();
        const recipesRes = await fetch(`${PROXY}/recipes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: pantryItems }),
        });
        if (!recipesRes.ok) throw new Error("Gemini recipe error: " + recipesRes.status);
        const recipesData = await recipesRes.json();
        if (onProcessed) onProcessed({ pantryItems, recipesText: recipesData.completion, images });
      } catch (err) {
        alert("Gemini API error: " + err.message);
        if (onProcessed) onProcessed({ pantryItems: [], recipesText: "", images });
      }
      if (!cancelled && onDone) onDone();
    }
    processImages();
    return () => {
      cancelled = true;
    };
  }, [images, onDone, onProcessed]);

  return (
    <div className="processing-window">
      <h2>Processing...</h2>
      <div className="progress-bar">
        <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
      </div>
      <div>{progress}%</div>
    </div>
  );
}
