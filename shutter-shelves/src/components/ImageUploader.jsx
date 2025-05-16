import React, { useState, useCallback } from 'react';
import { extractPantryItems, getTopRecipes } from '../lib/openai';

export default function ImageUploader({ onItemsIdentified, onRecipesGenerated }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const b64 = reader.result.split(',')[1];
      try {
        const items = await extractPantryItems(b64, file.type);
        onItemsIdentified(items);
        const recipes = await getTopRecipes(items);
        onRecipesGenerated(recipes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  }, [file, onItemsIdentified, onRecipesGenerated]);

  // Run automatically whenever a new file is set
  React.useEffect(() => {
    if (file) analyze();
  }, [file, analyze]);

  function handleChange(e) {
    const f = e.target.files[0];
    if (f) {
      onItemsIdentified([]);       // clear previous
      onRecipesGenerated([]);
      setFile(f);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block border-2 border-dashed border-blue-400 p-8 rounded-lg text-center cursor-pointer">
        {file ? file.name : 'Drag & drop or click to select an image'}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />
      </label>

      {/* Optional manual trigger */}
      <div className="text-center">
        <button
          onClick={analyze}
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : file ? 'Re-Analyze Image' : 'Upload to Analyze'}
        </button>
      </div>
    </div>
  );
}
