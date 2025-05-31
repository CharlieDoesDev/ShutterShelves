import React, { useRef, useState } from "react";
import StyledButton from "./components/StyledButton";

export default function App() {
  const [images, setImages] = useState([]); // Array of { dataUrl, analysis, recipes }
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [error, setError] = useState(null);
  const inputRef = useRef();

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

  async function onFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setError(null);
    const newImages = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        // Generate placeholder analysis and recipes
        const analysis = generateAnalysis();
        const recipes = generateRecipes(analysis);
        return { dataUrl, analysis, recipes };
      })
    );
    setImages((prev) => (appendMode ? [...prev, ...newImages] : newImages));
  }

  function handleReset() {
    setImages([]);
    setShowUploader(true);
    setAppendMode(false);
    setError(null);
  }
  function handleAppend() {
    setAppendMode(true);
    setShowUploader(true);
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Blurry food background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center blur-sm opacity-60"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] flex flex-col bg-opacity-80">
        <div className="flex-1 flex flex-col overflow-y-auto items-center justify-center">
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
            className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg active:scale-95 transition-all mb-6 mx-auto"
            onClick={() => inputRef.current.click()}
            aria-label="Open Camera"
            style={{
              borderRadius: "50%",
              width: "5rem",
              height: "5rem",
              padding: 0,
            }}
            imagePath={null}
          >
            {images.length === 0 ? "Upload/Take Photo(s)" : "Add More"}
          </StyledButton>
          {error && <div className="text-red-500 mb-4">{error}</div>}
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
        </div>
      </div>
    </div>
  );
}
