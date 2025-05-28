import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import PantryResults from './components/PantryResults';
import RecipeRecommendations from './components/RecipeRecommendations';
import { analyzeImageWithAzure } from './lib/azure-vision';

const AZURE_VISION_ENDPOINT = 'https://shuttershelvesvision.cognitiveservices.azure.com/vision/v4.0/analyze';
const AZURE_API_KEY = import.meta.env.VITE_AZURE_VISION_KEY;

export default function App() {
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  function handleItemsIdentified(newItems, append) {
    if (append) {
      setItems((prev) => [...prev, ...newItems]);
    } else {
      setItems(newItems);
    }
  }
  function handleRecipesGenerated(newRecipes, append) {
    if (append) {
      setRecipes((prev) => [...prev, ...newRecipes]);
    } else {
      setRecipes(newRecipes);
    }
  }
  async function handleAzureVision(imageBase64, append) {
    try {
      const visionResult = await analyzeImageWithAzure(imageBase64);
      const items = visionResult.tags?.map(t => t.name) || [];
      handleItemsIdentified(items, append);
      const recipes = await getTopRecipes(items);
      handleRecipesGenerated(recipes, append);
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
  function handlePhotoTaken() {
    setShowUploader(false);
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
            onItemsIdentified={handleItemsIdentified}
            onRecipesGenerated={handleRecipesGenerated}
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
