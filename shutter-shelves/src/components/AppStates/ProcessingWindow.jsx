import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";
import CenterPanel from "../SimpleContainers/CenterPanel";
import { getRecipePrompts, aggressiveGeminiClean } from "../../lib/recipeUtils";

async function retryFetch(url, options, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      
      // If we get a 502, wait and retry
      if (res.status === 502) {
        if (attempt === maxRetries) {
          throw new Error(`Gemini API unavailable after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw new Error(`API error: ${res.status}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

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
          const res = await retryFetch(`${PROXY}/vision`, {
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
          prompts.map(async (prompt, index) => {
            try {
              const res = await retryFetch(`${PROXY}/recipes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  items: pantryItems, 
                  prompt,
                  format: "json"  // Request JSON format explicitly
                }),
              });
              
              const data = await res.json();
              
              // Clean and parse response
              try {
                const cleaned = aggressiveGeminiClean(data.completion);
                const recipeObj = JSON.parse(cleaned);
                
                // Ensure we have the required fields
                return {
                  title: recipeObj.title || `Recipe ${index + 1}`,
                  ingredients: Array.isArray(recipeObj.ingredients) ? recipeObj.ingredients : [],
                  steps: recipeObj.instructions || recipeObj.steps || [],
                };
              } catch (e) {
                console.error("Recipe parsing error:", e);
                return {
                  title: "Recipe Parse Error",
                  ingredients: [],
                  steps: ["Failed to parse recipe. Please try again."],
                  parseError: true
                };
              }
            } catch (err) {
              console.error("Recipe generation error:", err);
              return {
                title: "Recipe Generation Error",
                ingredients: [],
                steps: ["Failed to generate recipe. Please try again."],
                parseError: true
              };
            }
          })
        );

        // Filter out failed recipes
        const validRecipes = recipeResponses.filter(r => !r.parseError);
        
        if (validRecipes.length === 0) {
          throw new Error("Unable to generate any valid recipes. Please try again.");
        }

        if (onProcessed) {
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
        alert(err.message || "An error occurred while processing your request. Please try again.");
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
