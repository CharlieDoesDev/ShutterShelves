import React, { useState, useCallback, useRef } from 'react';
import { extractPantryItems, getTopRecipes } from '../lib/openai';

export default function ImageUploader({ onItemsIdentified, onRecipesGenerated, onReset, appendMode }) {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const analyze = useCallback(async (imgFile) => {
    if (!imgFile) return;
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(imgFile);
    reader.onloadend = async () => {
      const b64 = reader.result.split(',')[1];
      setImage(reader.result);
      try {
        const items = await extractPantryItems(b64, imgFile.type);
        onItemsIdentified(items, appendMode);
        const recipes = await getTopRecipes(items);
        onRecipesGenerated(recipes, appendMode);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  }, [onItemsIdentified, onRecipesGenerated, appendMode]);

  function handleCapture(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      analyze(f);
    }
  }

  function handleRetake() {
    setImage(null);
    setFile(null);
    onReset && onReset();
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full flex items-center justify-between mb-4">
        <button
          className="text-blue-400 text-lg font-bold px-2 py-1 rounded hover:bg-blue-50 transition-all"
          onClick={handleRetake}
          aria-label="Back"
        >
          ← Back
        </button>
        {appendMode && (
          <span className="text-xs text-gray-400 ml-2">Append Mode</span>
        )}
      </div>
      {!image && (
        <button
          className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg active:scale-95 transition-all mb-6"
          onClick={() => inputRef.current.click()}
          aria-label="Open Camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6a2.25 2.25 0 0 1 2.25-2.25h2.379a2.25 2.25 0 0 0 1.591-.659l.83-.83A2.25 2.25 0 0 1 12.621 2.25h2.758a2.25 2.25 0 0 1 1.591.659l.83.83a2.25 2.25 0 0 0 1.591.659h2.379A2.25 2.25 0 0 1 21 6v1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18M3 7.5v10.125A2.25 2.25 0 0 0 5.25 19.875h13.5A2.25 2.25 0 0 0 21 17.625V7.5M3 7.5l1.5 12.375M21 7.5l-1.5 12.375" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
        disabled={loading}
      />
      {image && (
        <div className="w-full flex flex-col items-center">
          <img
            src={image}
            alt="Captured"
            className="rounded-xl shadow-lg w-full max-w-xs object-cover mb-4 border border-gray-200"
            style={{ aspectRatio: '1/1', background: '#eee' }}
          />
          <button
            className="text-blue-500 underline text-sm mb-2"
            onClick={handleRetake}
          >
            Retake Photo
          </button>
        </div>
      )}
      {loading && <div className="text-blue-400 mt-4">Analyzing…</div>}
    </div>
  );
}
