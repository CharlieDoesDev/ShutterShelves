import React, { useState, useCallback, useRef } from "react";
import StyledButton from "./StyledButton";

export default function ImageUploader({ onReset, appendMode, onAzureVision }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const analyze = useCallback(
    async (imgFile) => {
      if (!imgFile) return;
      setLoading(true);
      const reader = new FileReader();
      reader.readAsDataURL(imgFile);
      reader.onloadend = async () => {
        const b64 = reader.result.split(",")[1];
        setImage(reader.result);
        try {
          if (onAzureVision) {
            await onAzureVision(b64, appendMode);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
    },
    [onAzureVision, appendMode]
  );

  function handleCapture(e) {
    const f = e.target.files[0];
    if (f) analyze(f);
  }

  function handleRetake() {
    setImage(null);
    onReset && onReset();
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80')",
      }}
    >
      <div
        className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm -z-10"
        aria-hidden="true"
      />
      <div className="flex flex-col items-center justify-center w-full max-w-md p-8 rounded-lg shadow-lg bg-white bg-opacity-80">
        <div className="w-full flex items-center justify-between mb-4">
          <StyledButton
            className="text-blue-400 text-lg font-bold px-2 py-1 rounded hover:bg-blue-50 transition-all"
            onClick={handleRetake}
            aria-label="Back"
          >
            ← Back
          </StyledButton>
          {appendMode && (
            <span className="text-xs text-gray-400 ml-2">Append Mode</span>
          )}
        </div>
        {!image && (
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
            {/* Friendly camera icon (smile) */}
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
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
          disabled={loading}
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
              className="text-blue-500 underline text-sm mb-2"
              onClick={handleRetake}
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
        {loading && <div className="text-blue-400 mt-4">Analyzing…</div>}
      </div>
    </div>
  );
}
