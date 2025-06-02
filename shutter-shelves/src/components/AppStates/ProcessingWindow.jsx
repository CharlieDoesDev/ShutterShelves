import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";
import CenterPanel from "../SimpleContainers/CenterPanel";
import {
  getRecipePrompts,
  aggressiveGeminiClean,
  parseRecipeInput
} from "../../lib/recipeUtils";

async function retryFetch(url, options, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 502 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delay * attempt));
        continue;
      }
      throw new Error(`API error: ${res.status}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, delay * attempt));
    }
  }
}

export default function ProcessingWindow({ images, onDone, onProcessed }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function processImages() {
      // 1) Kick off a fake “loading” animation to show initial progress
      await asyncProgressBar((p) => {
        if (!cancelled) setProgress(p * 0.2); // scale to 0–20%
      });

      // 2) Convert each image to base64, call vision API
      const { dataUrlToBase64Object } = await import(
        "../../lib/imageUploader"
      );
      const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";
      const base64Array = images.map((photo) =>
        dataUrlToBase64Object(photo.dataUrl).base64
      );

      const pantryItems = [];
      const captions = [];

      try {
        let idx = 0;
        for (const base64 of base64Array) {
          const res = await retryFetch(`${PROXY}/vision`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // your proxy’s contract might vary—double-check!
              prompt:
                "List all visible food and pantry items in this image, separated by commas. If none are detected, respond with 'none'.",
              image_data: base64
            }),
          });
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          captions.push(text);

          // split on commas, trim out “none”
          const items = text
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t && t.toLowerCase() !== "none");
          pantryItems.push(...items);

          // increment progress (20–35%)
          idx++;
          if (!cancelled) setProgress(20 + (15 * idx) / base64Array.length);
        }

        if (!pantryItems.length) {
          throw new Error("No pantry items detected in the images");
        }

        // 3) Build prompts and fetch recipes
        const N = 3; // how many recipes
        const prompts = getRecipePrompts(pantryItems, N);

        const recipeResponses = [];
        for (let i = 0; i < prompts.length; i++) {
          const prompt = prompts[i];
          try {
            const res = await retryFetch(`${PROXY}/recipes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt }), // proxy likely only needs prompt
            });
            const data = await res.json();

            // 4) Parse via parseRecipeInput instead of raw JSON.parse
            const recipeObj = parseRecipeInput(data.completion || data.text);
            if (recipeObj.parseError) {
              recipeResponses.push({
                title: "Recipe Parse Error",
                ingredients: [],
                steps: ["Failed to parse recipe. Please try again."],
                parseError: true,
              });
            } else {
              recipeResponses.push(recipeObj);
            }
          } catch (err) {
            recipeResponses.push({
              title: "Recipe Generation Error",
              ingredients: [],
              steps: ["Failed to generate recipe. Please try again."],
              parseError: true,
            });
          }

          // bump progress from 35% up to 90% over all recipes
          if (!cancelled) {
            setProgress(35 + (55 * (i + 1)) / prompts.length);
          }
        }

        // 5) Filter out parse errors
        const validRecipes = recipeResponses.filter((r) => !r.parseError);
        if (!validRecipes.length) {
          throw new Error("Unable to generate any valid recipes. Please try again.");
        }

        // 6) Hand back results (only if component still mounted)
        if (!cancelled && onProcessed) {
          onProcessed({
            pantryItems,
            recipesText: JSON.stringify(validRecipes, null, 2),
            images,
            parsedRecipes: validRecipes,
            captions,
          });
        }
      } catch (err) {
        console.error("Processing error:", err);
        if (!cancelled && onProcessed) {
          onProcessed({
            pantryItems: [],
            recipesText: "",
            images,
            parsedRecipes: [],
            error: err.message,
          });
        }
        alert(err.message || "An error occurred while processing your request.");
      } finally {
        if (!cancelled && onDone) onDone();
      }
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
        <div>{Math.round(progress)}%</div>
      </div>
    </CenterPanel>
  );
}
