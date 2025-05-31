import React, { useRef, useState } from "react";
import StyledButton from "./components/StyledButton";
import { handleImageUpload } from "./lib/imageUploader";
import CenterPanel from "./components/CenterPanel";

export default function App() {
  // State for uploaded images (array of { dataUrl, base64, analysis, recipes })
  const [images, setImages] = useState([]);
  const inputRef = useRef();

  // Handle file input change (multi-upload supported)
  async function onFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = await handleImageUpload(files);
    // For each image, generate placeholder analysis and recipes
    const withAnalysis = newImages.map((img) => {
      const analysis = generateAnalysis();
      return {
        ...img,
        analysis,
        recipes: generateRecipes(analysis),
      };
    });
    setImages((prev) => [...prev, ...withAnalysis]);
    // Reset input value so the same file can be uploaded again if needed
    e.target.value = "";
  }

  // Remove an image by index
  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // Reset all images
  function handleReset() {
    setImages([]);
  }

  // Placeholder analysis generator
  function generateAnalysis() {
    const items = [
      "canned beans",
      "pasta",
      "tomato sauce",
      "olive oil",
      "salt",
      "pepper",
      "rice",
      "spices",
    ];
    // Randomly select 3-6 items
    const count = Math.floor(Math.random() * 4) + 3;
    return items.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  // Placeholder recipe generator
  function generateRecipes(analysis) {
    return [
      {
        title: "Pantry Pasta",
        ingredients: analysis.slice(0, 3),
        steps: ["Boil pasta.", "Heat sauce.", "Combine and serve."],
      },
      {
        title: "Quick Rice Bowl",
        ingredients: analysis.slice(0, 2),
        steps: ["Cook rice.", "Add toppings.", "Enjoy!"],
      },
    ];
  }

  // Main app UI
  return (
    <div className="center-panel-parent relative overflow-hidden">
      <CenterPanel>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onFileChange}
          className="hidden"
        />
        <StyledButton
          className="camera-btn mb-6 mx-auto"
          onClick={() => inputRef.current.click()}
          aria-label="Open Camera"
          imagePath={null}
        >
          {images.length === 0 ? "Upload/Take Photo(s)" : "Add More"}
        </StyledButton>
        {images.length > 0 && (
          <div className="w-full flex flex-col items-center gap-8 mt-4">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="w-full max-w-xs flex flex-col items-center bg-white bg-opacity-80 rounded-xl shadow-lg p-4 mb-4"
              >
                <img
                  src={img.dataUrl}
                  alt={`Captured ${idx + 1}`}
                  className="rounded-xl shadow w-full object-cover mb-2 border border-gray-200"
                  style={{ aspectRatio: "1/1", background: "#eee" }}
                />
                <button
                  className="text-red-500 underline text-xs mb-2"
                  onClick={() => removeImage(idx)}
                  style={{
                    borderRadius: "0.375rem",
                    width: "auto",
                    height: "auto",
                    fontSize: "0.9rem",
                    padding: "0.25rem 0.5rem",
                  }}
                >
                  Remove
                </button>
                <div className="mb-2">
                  <strong>Identified Items:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {img.analysis.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Recipes:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-2">
                    {img.recipes.map((r, i) => (
                      <li
                        key={i}
                        className="border rounded p-2 bg-gray-50"
                      >
                        <div className="font-bold">{r.title}</div>
                        <div>
                          <span className="font-semibold">Ingredients:</span>
                          <ul className="list-disc list-inside ml-4">
                            {r.ingredients.map((ing, j) => (
                              <li key={j}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">Steps:</span>
                          <ol className="list-decimal list-inside ml-4">
                            {r.steps.map((step, k) => (
                              <li key={k}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
            <button
              className="text-blue-500 underline text-sm mb-2"
              onClick={handleReset}
              style={{
                borderRadius: "0.375rem",
                width: "auto",
                height: "auto",
                fontSize: "1rem",
                padding: "0.5rem 1rem",
              }}
            >
              Reset
            </button>
          </div>
        )}
      </CenterPanel>
    </div>
  );
}
