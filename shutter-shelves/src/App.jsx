import React, { useEffect, useRef, useState } from "react";
import StyledButton from "./components/StyledButton";
import { analyzeImageWithAzure } from "./lib/azure-vision";
import { getRecipesFromOpenAI } from "./lib/azure-openai";
import { handleImageUpload } from "./lib/imageUploader";
import CenterPanel from "./components/CenterPanel";

export default function App() {
  // App state
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [env, setEnv] = useState(null);
  const [loadingEnv, setLoadingEnv] = useState(true);
  const [envError, setEnvError] = useState(null);
  const [images, setImages] = useState([]); // Array of { dataUrl, base64, analysis, recipes }
  const inputRef = useRef();

  // Fetch and decrypt env on mount
  useEffect(() => {
    async function fetchAndDecryptEnv() {
      try {
        const res = await fetch(import.meta.env.BASE_URL + "config.env.enc");
        if (!res.ok) throw new Error("Failed to fetch encrypted env");
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
      if (!env) throw new Error("Environment not loaded");
      // Only call Azure Vision to extract items from the image
      const visionResult = await analyzeImageWithAzure(imageBase64, env);
      const itemsExtracted = visionResult.tags?.map((t) => t.name) || [];
      setItems(
        append ? (prev) => [...prev, ...itemsExtracted] : itemsExtracted
      );
      console.log("Extracted items:", itemsExtracted);

      // Only call Gemini to generate recipes from the extracted items
      if (itemsExtracted.length === 0) {
        setRecipes([]);
        return;
      }
      const recipeResult = await getRecipesFromOpenAI(itemsExtracted, env);
      console.log("Gemini recipe completion:", recipeResult);
      setRecipes([recipeResult.completion]);
      setEnvError(null); // Clear any previous error
    } catch (err) {
      // Show a generic error message, not OpenAI-specific
      setEnvError(
        "A problem occurred while generating recipes. Please wait and try again."
      );
      console.error(err);
    }
  }

  function handleReset() {
    setItems([]);
    setRecipes([]);
    setShowUploader(true);
    setAppendMode(false);
    setImages([]);
  }
  function handleAppend() {
    setAppendMode(true);
    setShowUploader(true);
  }
  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = await handleImageUpload(files);
    // For each image, generate placeholder analysis and recipes
    const withAnalysis = newImages.map((img) => ({
      ...img,
      analysis: generateAnalysis(),
      recipes: generateRecipes(generateAnalysis()),
    }));
    setImages((prev) => [...prev, ...withAnalysis]);
  }

  // Placeholder analysis generator
  function generateAnalysis() {
    const items = [
      "canned beans",
      "pasta",
      "tomato sauce",
      "olive oil",
      "salt",
      "pepper",
      "rice",
      "spices",
    ];
    // Randomly select 3-6 items
    const count = Math.floor(Math.random() * 4) + 3;
    return items.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  // Placeholder recipe generator
  function generateRecipes(analysis) {
    return [
      {
        title: "Pantry Pasta",
        ingredients: analysis.slice(0, 3),
        steps: ["Boil pasta.", "Heat sauce.", "Combine and serve."],
      },
      {
        title: "Quick Rice Bowl",
        ingredients: analysis.slice(0, 2),
        steps: ["Cook rice.", "Add toppings.", "Enjoy!"],
      },
    ];
  }

  if (loadingEnv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading configuration...
      </div>
    );
  }
  if (envError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {envError}
      </div>
    );
  }

  // Main app UI
  return (
    <CenterPanel>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
        display="none"
      />
      <StyledButton
        className="camera-btn mb-6 mx-auto"
        onClick={() => inputRef.current.click()}
        aria-label="Open Camera"
        imagePath={image}
      />
      {image && (
        <div className="w-full flex flex-col items-center">
          <img
            src={image}
            alt="Captured"
            className="rounded-xl shadow-lg w-full max-w-xs object-cover mb-4 border border-gray-200"
            style={{ aspectRatio: "1/1", background: "#eee" }}
          />
          <StyledButton
            className="retake-btn mb-2"
            onClick={() => setImage(null)}
            imagePath={null}
          >
            Retake Photo
          </StyledButton>
        </div>
      )}
    </CenterPanel>
  );
}

// Real decryptEnv: matches encrypt_env.py (AES-GCM, PBKDF2, SHA256, 200k iterations, 16-byte salt, 12-byte nonce)
async function decryptEnv(encBuffer) {
  // Prompt for password (show a modal or use prompt for demo)
  const password = prompt("Enter decryption password:");
  if (!password) throw new Error("No password provided");

  const bytes = new Uint8Array(encBuffer);
  const salt = bytes.slice(0, 16);
  const nonce = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);

  // Derive key using PBKDF2 (SHA256, 200k iterations)
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 200000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt with AES-GCM
  let plaintext;
  try {
    plaintext = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      ciphertext
    );
  } catch (e) {
    throw new Error("Decryption failed: wrong password or corrupted file");
  }

  // Try to parse as .env (key=value) or JSON
  const text = new TextDecoder().decode(plaintext);
  try {
    // Try JSON first
    return JSON.parse(text);
  } catch {
    // Fallback: parse .env format
    const env = {};
    text.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    });
    return env;
  }
}
