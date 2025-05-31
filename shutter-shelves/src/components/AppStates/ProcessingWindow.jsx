import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";

export default function ProcessingWindow({ images, onDone, onProcessed }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function processImages() {
      // Show progress bar while processing
      await asyncProgressBar((p) => {
        if (!cancelled) setProgress(p);
      });
      // After progress bar, call Gemini API via proxy
      try {
        const { dataUrlToBase64Object } = await import("../../lib/imageUploader");
        const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";
        const base64Array = images.map(photo => dataUrlToBase64Object(photo.dataUrl).base64);
        // Refined prompt for Gemini Vision
        const visionPrompt = `You are a kitchen assistant. Describe this image in detail, focusing on identifying all visible food, pantry, or kitchen items. If the image does not contain any food, pantry, or kitchen items, say: 'No food, pantry, or kitchen items detected.'`;
        // Get captions for all images via proxy
        const captions = [];
        for (const base64 of base64Array) {
          const res = await fetch(
            `${PROXY}/vision`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: visionPrompt, imageBase64: base64 })
            }
          );
          if (!res.ok) throw new Error("Gemini Vision error: " + res.status);
          const data = await res.json();
          const caption = data.caption || data.result || data.text || "";
          captions.push(caption);
        }
        // If any caption says no food/pantry/kitchen, warn and abort
        const isFoodRelated = captions.some(caption => !/no food, pantry, or kitchen items detected/i.test(caption) && /food|pantry|kitchen|ingredient|can|jar|bottle|spice|snack|grain|produce|vegetable|fruit|bread|cereal|rice|pasta|sauce|oil|salt|pepper|sugar/i.test(caption));
        if (!isFoodRelated) {
          alert("No food, pantry, or kitchen items detected in the photo(s). Please try again with a clear photo of your pantry or food items.");
          if (onProcessed) onProcessed({ pantryItems: [], recipesText: '', images, parsedRecipes: [] });
          if (!cancelled && onDone) onDone();
          return;
        }
        // Gemini pantry/recipe logic
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
        // Try to parse Gemini's recipesData.completion into an array of recipe objects
        let parsedRecipes = [];
        try {
          parsedRecipes = JSON.parse(recipesData.completion);
          if (!Array.isArray(parsedRecipes)) parsedRecipes = [parsedRecipes];
        } catch {
          parsedRecipes = [{ title: "Recipes", ingredients: pantryItems || [], steps: [recipesData.completion] }];
        }
        if (onProcessed) onProcessed({ pantryItems, recipesText: recipesData.completion, images, parsedRecipes });
      } catch (err) {
        alert("Gemini API error: " + err.message);
        if (onProcessed) onProcessed({ pantryItems: [], recipesText: "", images, parsedRecipes: [] });
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
