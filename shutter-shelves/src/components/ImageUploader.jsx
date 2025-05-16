import React, { useState } from 'react';
import { openai } from '../lib/openai';

export default function ImageUploader({ onItemsIdentified, onRecipesGenerated }) {
  const [loading, setLoading] = useState(false);

  async function handleFile(file) {
    setLoading(true);
    // read as base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const b64 = reader.result.split(',')[1];
      // 1) Vision call: extract items
      const vis = await openai.chat.completions.create({
        model: import.meta.env.VITE_AOAI_DEPLOYMENT,
        messages: [
          { role: 'system', content: 'Extract pantry item names from this image.' },
          { role: 'user', content: b64, contentType: file.type },
        ],
        temperature: 0,
        max_tokens: 200,
      });
      const items = JSON.parse(vis.choices[0].message.content);
      onItemsIdentified(items);

      // 2) Recipe call: get top-5 recipes
      const rec = await openai.chat.completions.create({
        model: import.meta.env.VITE_AOAI_DEPLOYMENT,
        messages: [
          { role: 'system', content: 'Given a JSON array of pantry items, return a JSON array of up to five recipe titles that can be made with those items.' },
          { role: 'user', content: JSON.stringify(items) },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });
      const recipes = JSON.parse(rec.choices[0].message.content);
      onRecipesGenerated(recipes);

      setLoading(false);
    };
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        accept="image/*"
        onChange={e => handleFile(e.target.files[0])}
        disabled={loading}
      />
      {loading && <p className="mt-4">Analyzing…</p>}
    </div>
  );
}
