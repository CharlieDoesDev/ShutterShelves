import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import PantryResults from './components/PantryResults';
import RecipeRecommendations from './components/RecipeRecommendations';

export default function App() {
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center">PantryPilot</h1>
      <ImageUploader
        onItemsIdentified={setItems}
        onRecipesGenerated={setRecipes}
      />
      {items.length > 0 && <PantryResults items={items} />}
      {recipes.length > 0 && <RecipeRecommendations recipes={recipes} />}
    </div>
  );
}
