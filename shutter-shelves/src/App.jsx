import React, { useEffect, useRef, useState } from "react";
import StyledButton from "./components/StyledButton";
import { analyzeImageWithAzure } from "./lib/azure-vision";
import { getRecipesFromOpenAI } from "./lib/azure-openai";
import { handleImageUpload } from "./lib/imageUploader";

export default function App() {
  // App state
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [env, setEnv] = useState(null);
  const [loadingEnv, setLoadingEnv] = useState(true);
  const [envError, setEnvError] = useState(null);
  const [image, setImage] = useState(null);
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
    setImage(null);
  }
  function handleAppend() {
    setAppendMode(true);
    setShowUploader(true);
  }

  async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const result = await handleImageUpload(file, handleAzureVision, appendMode);
    if (result && result.dataUrl) setImage(result.dataUrl);
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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Blurry food background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center blur-sm opacity-60"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] flex flex-col bg-opacity-80">
        <div className="flex-1 flex flex-col overflow-y-auto items-center justify-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
          <StyledButton
            className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg active:scale-95 transition-all mb-6 mx-auto"
            onClick={() => inputRef.current.click()}
            aria-label="Open Camera"
            style={{
              borderRadius: "50%",
              width: "5rem",
              height: "5rem",
              padding: 0,
            }}
          >
            {/* Camera icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-10 h-10"
            >
              <circle
                cx="12"
                cy="12"
                r="8"
                stroke="#fff"
                strokeWidth="1.5"
                fill="#60a5fa"
              />
              <rect
                x="8.5"
                y="7.5"
                width="7"
                height="5"
                rx="2.5"
                fill="#fff"
                stroke="#fff"
                strokeWidth="0.5"
              />
              <circle cx="12" cy="10" r="1.5" fill="#60a5fa" />
              <path
                d="M9 14c.5 1 2.5 1 3 0"
                stroke="#fff"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </StyledButton>
          {image && (
            <div className="w-full flex flex-col items-center">
              <img
                src={image}
                alt="Captured"
                className="rounded-xl shadow-lg w-full max-w-xs object-cover mb-4 border border-gray-200"
                style={{ aspectRatio: "1/1", background: "#eee" }}
              />
              <StyledButton
                className="text-blue-500 underline text-sm mb-2"
                onClick={() => setImage(null)}
                style={{
                  borderRadius: "0.375rem",
                  width: "auto",
                  height: "auto",
                  fontSize: "1rem",
                  padding: "0.5rem 1rem",
                }}
              >
                Retake Photo
              </StyledButton>
            </div>
          )}
        </div>
      </div>
    </div>
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
