import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import PantryResults from './components/PantryResults';
import RecipeRecommendations from './components/RecipeRecommendations';
import { analyzeImageWithAzure } from './lib/azure-vision';
import { getRecipesFromOpenAI } from './lib/azure-openai';

export default function App() {
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  async function handleAzureVision(imageBase64, append) {
    try {
      const visionResult = await analyzeImageWithAzure(imageBase64);
      // Use tags as pantry items
      const itemsExtracted = visionResult.tags?.map((t) => t.name) || [];
      setItems(append ? (prev) => [...prev, ...itemsExtracted] : itemsExtracted);
      // Get recipes from OpenAI
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
