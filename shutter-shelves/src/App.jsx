import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import PantryResults from './components/PantryResults';
import RecipeRecommendations from './components/RecipeRecommendations';
import { analyzeImageWithAzure } from './lib/azure-vision';
import { getRecipesFromOpenAI } from './lib/azure-openai';

export default function App() {
  // App state
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [env, setEnv] = useState(null);
  const [loadingEnv, setLoadingEnv] = useState(true);
  const [envError, setEnvError] = useState(null);

  // Fetch and decrypt env on mount
  useEffect(() => {
    async function fetchAndDecryptEnv() {
      try {
        const res = await fetch('/config.env.enc');
        if (!res.ok) throw new Error('Failed to fetch encrypted env');
        const enc = await res.arrayBuffer();
        // TODO: Implement decryptEnv to return a JS object from ArrayBuffer
        const decrypted = await decryptEnv(enc); // You must implement this function
        setEnv(decrypted);
        setLoadingEnv(false);
      } catch (err) {
        setEnvError(err.message);
        setLoadingEnv(false);
      }
    }
    fetchAndDecryptEnv();
  }, []);

  async function handleAzureVision(imageBase64, append) {
    try {
      if (!env) throw new Error('Environment not loaded');
      // Pass env to your API functions as needed
      const visionResult = await analyzeImageWithAzure(imageBase64, env);
      const itemsExtracted = visionResult.tags?.map((t) => t.name) || [];
      setItems(append ? (prev) => [...prev, ...itemsExtracted] : itemsExtracted);

      const recipeResult = await getRecipesFromOpenAI(itemsExtracted, env);
      let recipesArr = [];
      try {
        const content = recipeResult.choices?.[0]?.message?.content || '[]';
        recipesArr = JSON.parse(
          content.slice(content.indexOf('['), content.lastIndexOf(']') + 1)
        );
      } catch (e) {
        recipesArr = [];
      }
      setRecipes(append ? (prev) => [...prev, ...recipesArr] : recipesArr);
    } catch (err) {
      console.error(err);
    }
  }

  function handleReset() {
    setItems([]);
    setRecipes([]);
    setShowUploader(true);
    setAppendMode(false);
  }
  function handleAppend() {
    setAppendMode(true);
    setShowUploader(true);
  }

  if (loadingEnv) {
    return <div className="min-h-screen flex items-center justify-center">Loading configuration...</div>;
  }
  if (envError) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{envError}</div>;
  }

  // Main app UI
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] flex flex-col">
      <div className="flex-1 flex flex-col overflow-y-auto">
        {showUploader ? (
          <ImageUploader
            onReset={handleReset}
            appendMode={appendMode}
            onAzureVision={handleAzureVision}
            env={env}
          />
        ) : (
          <div className="flex flex-col items-center w-full px-2 pt-2 pb-8">
            <div className="w-full flex items-center justify-between mb-2">
              <button
                className="text-blue-400 text-lg font-bold px-2 py-1 rounded hover:bg-blue-50 transition-all"
                onClick={handleReset}
                aria-label="Back"
              >
                ← Back
              </button>
              <button
                className="text-xs text-blue-500 underline ml-2"
                onClick={handleAppend}
              >
                Add Another Photo
              </button>
            </div>
            <div className="w-full max-w-xs mx-auto flex flex-col gap-6 overflow-y-auto">
              {items.length > 0 && <PantryResults items={items} />}
              {recipes.length > 0 && <RecipeRecommendations recipes={recipes} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple demo: assumes config.env.enc is base64-encoded JSON
async function decryptEnv(encBuffer) {
  // Convert ArrayBuffer to string
  const b64 = btoa(String.fromCharCode(...new Uint8Array(encBuffer)));
  // Decode base64 to JSON string
  const jsonStr = atob(b64);
  // Parse JSON
  return JSON.parse(jsonStr);
}