import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import PantryResults from './components/PantryResults';
import RecipeRecommendations from './components/RecipeRecommendations';
import { analyzeImageWithAzure } from './lib/azure-vision';
import { getRecipesFromOpenAI } from './lib/azure-openai';

export default function App() {
  // Authentication state
  const [passwordInput, setPasswordInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // App state
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  // Hardcoded or env-based expected password
  const EXPECTED_PASSWORD = process.env.REACT_APP_ACCESS_PASSWORD || 'secret';

  const handleLogin = () => {
    if (passwordInput === EXPECTED_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('🔒 Incorrect password. Try again.');
      setPasswordInput('');
    }
  };

  async function handleAzureVision(imageBase64, append) {
    try {
      const visionResult = await analyzeImageWithAzure(imageBase64);
      const itemsExtracted = visionResult.tags?.map((t) => t.name) || [];
      setItems(append ? (prev) => [...prev, ...itemsExtracted] : itemsExtracted);

      const recipeResult = await getRecipesFromOpenAI(itemsExtracted);
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

  // Render login prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef]">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Enter Access Password</h2>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-4"
            placeholder="Password"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Unlock
          </button>
        </div>
      </div>
    );
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