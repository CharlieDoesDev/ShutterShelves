// src/components/ImageUploader.jsx
import React, { useState } from 'react';
import { extractPantryItems, getTopRecipes } from '../lib/openai';

export default function ImageUploader({ onItemsIdentified, onRecipesGenerated }) {
  const [loading, setLoading] = useState(false);

  async function handleFile(file) {
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const items = await extractPantryItems(base64, file.type);
        onItemsIdentified(items);

        const recipes = await getTopRecipes(items);
        onRecipesGenerated(recipes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} disabled={loading}/>
      {loading && <p className="mt-4">Analyzing…</p>}
    </div>
  );
}
