// src/components/ProcessingWindow/ProcessingWindow.jsx
import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";
import CenterPanel from "../SimpleContainers/CenterPanel";
import { parseRecipeInput } from "../../lib/recipeUtils";

async function retryFetch(url, options, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Try to read error body (if JSON) or fallback to text
      let errorBody;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }
      console.warn(
        `❌ ${url} → ${res.status} (attempt ${attempt}/${maxRetries})`,
        errorBody
      );

      // If transient (502), retry with backoff
      if (res.status === 502 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delay * attempt));
        continue;
      }
      throw new Error(`${res.status} - ${JSON.stringify(errorBody)}`);
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

    async function processAll() {
      // 1) Animate initial bar (0–10%)
      await asyncProgressBar((p) => {
        if (!cancelled) setProgress(p * 0.1);
      });

      // 2) Convert DataURLs → raw Base64 strings
      const { dataUrlToBase64Object } = await import(
        "../../lib/imageUploader"
      );
      const rawBase64Array = images.map((photo) =>
        dataUrlToBase64Object(photo.dataUrl).base64
      );

      // 3) CALL /pantry endpoint once with all base64 images
      try {
        if (rawBase64Array.length === 0) {
          throw new Error("No images to process");
        }

        // Build JSON body: either imagesBase64 or imageBase64
        const pantryPayload =
          rawBase64Array.length === 1
            ? { imageBase64: rawBase64Array[0] }
            : { imagesBase64: rawBase64Array };

        console.log("➡️ POST /pantry", pantryPayload);
        const pantryRes = await retryFetch(
          "https://pantry-pilot-proxy.shuttershells.workers.dev/pantry",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pantryPayload),
          }
        );
        const pantryItems = await pantryRes.json();
        console.log("🏷️ Detected pantry items:", pantryItems);

        // 3a) Update progress after pantry (10–30%)
        if (!cancelled) setProgress(30);

        if (!Array.isArray(pantryItems) || pantryItems.length === 0) {
          throw new Error("No pantry items detected in the images");
        }

        // 4) CALL /recipes with exactly { items: [ … ] }
        console.log("➡️ POST /recipes", { items: pantryItems });
        const recipeRes = await retryFetch(
          "https://pantry-pilot-proxy.shuttershells.workers.dev/recipes",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: pantryItems }),
          }
        );
        const recipeJson = await recipeRes.json();
        const rawCompletion = recipeJson.completion || "";
        console.log("📩 Raw recipe completion:", rawCompletion);

        // 4a) Update progress before parsing (30–60%)
        if (!cancelled) setProgress(60);

        // 5) Parse Gemini’s free-text into structured recipe objects
        //    parseRecipeInput will return { parseError: true } if it can’t parse.
        let parsed = parseRecipeInput(rawCompletion);
        // If Gemini returned multiple recipes in an array, parseRecipeInput will pick the first valid one.
        // If you’d prefer to extract an array of 5 recipe‐objects, you could adapt parseRecipeInput to return an array.
        const parsedArray = Array.isArray(parsed)
          ? parsed
          : [parsed];

        // 5a) Update progress (60–80%)
        if (!cancelled) setProgress(80);

        // 6) Separate valid vs. parse-errors
        const validRecipes = parsedArray.filter((r) => !r.parseError);
        const rawAttempts = parsedArray.map((r) => ({
          title: r.title,
          steps: r.steps,
          parseError: !!r.parseError,
        }));

        // 7) If no valid recipe, pass rawAttempts for debugging
        if (validRecipes.length === 0) {
          if (!cancelled && onProcessed) {
            onProcessed({
              pantryItems,
              captions: [], // the /pantry endpoint no longer returns captions
              parsedRecipes: [], 
              rawAttempts,
              error: null,
            });
          }
          if (!cancelled && onDone) onDone();
          return;
        }

        // 8) Success: return the valid recipes
        if (!cancelled && onProcessed) {
          onProcessed({
            pantryItems,
            captions: [], // still empty; /pantry only returns items
            parsedRecipes: validRecipes,
            rawAttempts,
            error: null,
          });
        }
      } catch (err) {
        console.error("Processing error:", err);
        if (!cancelled && onProcessed) {
          onProcessed({
            pantryItems: [],
            captions: [],
            parsedRecipes: [],
            rawAttempts: [],
            error: err.message,
          });
        }
      } finally {
        // 9) Finish progress bar (80–100%)
        if (!cancelled) {
          await asyncProgressBar((p) => {
            setProgress(80 + 20 * p);
          });
          if (onDone) onDone();
        }
      }
    }

    processAll();
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
