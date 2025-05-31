import React, { useState, useEffect } from "react";
import CenterPanel from "../SimpleContainers/CenterPanel";
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
        const { dataUrlToBase64Object } = await import(
          "../../lib/imageUploader"
        );
        const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";
        const base64Array = images.map(
          (photo) => dataUrlToBase64Object(photo.dataUrl).base64
        );
        // Official Gemini Vision prompt
        const visionPrompt = `You are a kitchen assistant. List all visible food, pantry, or kitchen items in this image. If none are detected, respond exactly: 'No food, pantry, or kitchen items detected.'`;
        // Robust Gemini Vision call via proxy
        const captions = [];
        for (const base64 of base64Array) {
          const res = await fetch(`${PROXY}/vision`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: visionPrompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64 } },
                  ],
                },
              ],
            }),
          });
          if (!res.ok) throw new Error("Gemini Vision error: " + res.status);
          const data = await res.json();
          // Official Gemini API response parsing
          let caption = "";
          if (
            data.candidates &&
            data.candidates[0]?.content?.parts?.[0]?.text
          ) {
            caption = data.candidates[0].content.parts[0].text;
          } else if (data.caption) {
            caption = data.caption;
          } else if (data.result) {
            caption = data.result;
          } else if (data.text) {
            caption = data.text;
          }
          captions.push(caption);
        }
        // Always proceed, even if captions are unexpected or contain 'no food' message
        // Gemini pantry/recipe logic
        const pantryRes = await fetch(`${PROXY}/pantry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagesBase64: base64Array }),
        });
        if (!pantryRes.ok)
          throw new Error("Gemini pantry error: " + pantryRes.status);
        const pantryItems = await pantryRes.json();
        const recipesRes = await fetch(`${PROXY}/recipes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: pantryItems }),
        });
        if (!recipesRes.ok)
          throw new Error("Gemini recipe error: " + recipesRes.status);
        const recipesData = await recipesRes.json();
        // Try to parse Gemini's recipesData.completion into an array of recipe objects
        let parsedRecipes = [];
        try {
          parsedRecipes = JSON.parse(recipesData.completion);
          if (!Array.isArray(parsedRecipes)) parsedRecipes = [parsedRecipes];
        } catch {
          parsedRecipes = [
            {
              title: "Recipes",
              ingredients: pantryItems || [],
              steps: [recipesData.completion],
            },
          ];
        }
        if (onProcessed)
          onProcessed({
            pantryItems,
            recipesText: recipesData.completion,
            images,
            parsedRecipes,
            captions,
          });
      } catch (err) {
        alert("Gemini API error: " + err.message);
        if (onProcessed)
          onProcessed({
            pantryItems: [],
            recipesText: "",
            images,
            parsedRecipes: [],
          });
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
          <div
            className="progress-bar-inner"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div>{progress}%</div>
      </div>
    </CenterPanel>
  );
}
