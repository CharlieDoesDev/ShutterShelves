import React, { useRef, useState } from "react";
import StyledButton from "./components/StyledButton";
import { handleImageUpload } from "./lib/imageUploader";
import CenterPanel from "./components/CenterPanel";

export default function App() {
  const [images, setImages] = useState([]);
  const inputRef = useRef();

  async function onFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = await handleImageUpload(files);
    const withAnalysis = newImages.map((img) => {
      const analysis = generateAnalysis();
      return {
        ...img,
        analysis,
        recipes: generateRecipes(analysis),
      };
    });
    setImages((prev) => [...prev, ...withAnalysis]);
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleReset() {
    setImages([]);
  }

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
    const count = Math.floor(Math.random() * 4) + 3;
    return items.sort(() => 0.5 - Math.random()).slice(0, count);
  }

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

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 font-sans"
      style={{ minHeight: "100dvh" }}
    >
      <div
        className="backdrop-blur-lg bg-white/60 rounded-3xl shadow-2xl border border-white/40 p-6 flex flex-col items-center w-full max-w-sm mx-2"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onFileChange}
          className="hidden"
        />
        <button
          className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 shadow-lg flex items-center justify-center mb-6 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200"
          onClick={() => inputRef.current.click()}
          aria-label="Open Camera"
        >
          <span className="text-white text-lg font-bold drop-shadow-lg text-center px-2">
            {images.length === 0 ? "Upload/Take\nPhoto(s)" : "Add More"}
          </span>
        </button>
        {images.length === 0 && (
          <div className="text-gray-500 text-center mb-2 text-base">
            Snap or upload one or more pantry photos to get instant recipe ideas!
          </div>
        )}
        {images.length > 0 && (
          <div className="w-full flex flex-col items-center gap-8 mt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="w-full max-w-xs flex flex-col items-center bg-white/90 rounded-2xl shadow-md p-4 mb-2 border border-gray-100"
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
                    fontSize: "0.9rem",
                    padding: "0.25rem 0.5rem",
                  }}
                >
                  Remove
                </button>
                <div className="mb-2 w-full">
                  <strong className="text-gray-700">Identified Items:</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600 text-sm">
                    {img.analysis.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </div>
                <div className="w-full">
                  <strong className="text-gray-700">Recipes:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-2 text-gray-700 text-sm">
                    {img.recipes.map((r, i) => (
                      <li key={i} className="border rounded p-2 bg-gray-50">
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
              className="text-blue-500 underline text-sm mb-2 mt-2"
              onClick={handleReset}
              style={{
                borderRadius: "0.375rem",
                fontSize: "1rem",
                padding: "0.5rem 1rem",
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
