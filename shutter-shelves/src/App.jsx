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
        const res = await fetch(import.meta.env.BASE_URL + 'config.env.enc');
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
      // Only call Azure Vision to extract items from the image
      const visionResult = await analyzeImageWithAzure(imageBase64, env);
      const itemsExtracted = visionResult.tags?.map((t) => t.name) || [];
      setItems(append ? (prev) => [...prev, ...itemsExtracted] : itemsExtracted);

      // Only call Gemini to generate recipes from the extracted items
      if (itemsExtracted.length === 0) {
        setRecipes([]);
        return;
      }
      const recipeResult = await getRecipesFromOpenAI(itemsExtracted, env);
      // recipeResult: { completion: string }
      setRecipes([recipeResult.completion]);
    } catch (err) {
      setEnvError(err.message || 'An error occurred.');
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

// Real decryptEnv: matches encrypt_env.py (AES-GCM, PBKDF2, SHA256, 200k iterations, 16-byte salt, 12-byte nonce)
async function decryptEnv(encBuffer) {
  // Prompt for password (show a modal or use prompt for demo)
  const password = prompt('Enter decryption password:');
  if (!password) throw new Error('No password provided');

  const bytes = new Uint8Array(encBuffer);
  const salt = bytes.slice(0, 16);
  const nonce = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);

  // Derive key using PBKDF2 (SHA256, 200k iterations)
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt with AES-GCM
  let plaintext;
  try {
    plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      ciphertext
    );
  } catch (e) {
    throw new Error('Decryption failed: wrong password or corrupted file');
  }

  // Try to parse as .env (key=value) or JSON
  const text = new TextDecoder().decode(plaintext);
  try {
    // Try JSON first
    return JSON.parse(text);
  } catch {
    // Fallback: parse .env format
    const env = {};
    text.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    });
    return env;
  }
}