import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";
import CenterPanel from "../SimpleContainers/CenterPanel";
import { getRecipePrompts, cleanGeminiJsonString, aggressiveGeminiClean } from "../../lib/recipeUtils";

export default function ProcessingWindow({ images, onDone, onProcessed }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function processImages() {
      // Show progress bar while processing
      await asyncProgressBar((p) => {
        if (!cancelled) setProgress(p);
      });
      
      try {
        const { dataUrlToBase64Object } = await import("../../lib/imageUploader");
        const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";
        const base64Array = images.map(
          (photo) => dataUrlToBase64Object(photo.dataUrl).base64
        );
        
        // Get pantry items from vision API
        const captions = [];
        const pantryItems = [];
        for (const base64 of base64Array) {
          const res = await fetch(`${PROXY}/vision`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: "List all visible food and pantry items in this image, separated by commas. If none are detected, respond with 'none'." },
                    { inline_data: { mime_type: "image/jpeg", data: base64 } },
                  ],
                },
              ],
            }),
          });
          
          if (!res.ok) throw new Error("Gemini Vision error: " + res.status);
          const data = await res.json();
          
          let caption = "";
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            caption = data.candidates[0].content.parts[0].text;
            // Extract items from caption
            const items = caption
              .split(',')
              .map(item => item.trim())
              .filter(item => item && item.toLowerCase() !== 'none');
            pantryItems.push(...items);
          }
          captions.push(caption);
        }

        // Validate pantry items before requesting recipes
        if (!pantryItems.length) {
          throw new Error("No pantry items detected in the images");
        }

        // Get recipes for the detected items
        const N = 3; // Number of recipes to generate
        const prompts = getRecipePrompts(pantryItems, N);
        const recipeResponses = await Promise.all(
          prompts.map(async (prompt) => {
            const res = await fetch(`${PROXY}/recipes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: pantryItems, prompt }),
            });
            
            if (!res.ok) throw new Error("Gemini recipe error: " + res.status);
            const data = await res.json();
            
            // Clean and parse response
            let recipeObj = null;
            try {
              const cleaned = aggressiveGeminiClean(data.completion);
              recipeObj = JSON.parse(cleaned);
              if (recipeObj.instructions && !recipeObj.steps) {
                recipeObj.steps = recipeObj.instructions;
              }
            } catch (e) {
              console.error("Recipe parsing error:", e);
              recipeObj = {
                title: "Recipe Parse Error",
                ingredients: [],
                steps: [data.completion],
                parseError: true
              };
            }
            return recipeObj;
          })
        );

        if (onProcessed) {
          onProcessed({
            pantryItems,
            recipesText: JSON.stringify(recipeResponses, null, 2),
            images,
            parsedRecipes: recipeResponses,
            captions,
          });
        }
      } catch (err) {
        console.error("Processing error:", err);
        alert("Error: " + err.message);
        if (onProcessed) {
          onProcessed({
            pantryItems: [],
            recipesText: "",
            images,
            parsedRecipes: [],
            error: err.message
          });
        }
      }
      
      if (!cancelled && onDone) onDone();
    }
    
    processImages();
    return () => {
      cancelled = true;
    };
  }, [images, onDone, onProcessed]);

  return (
    <CenterPanel>
      <div className="processing-window">
        <h2>Processing...</h2>
        <div className="progress-bar">
          <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
        </div>
        <div>{progress}%</div>
      </div>
    </CenterPanel>
  );
}
