import React, { useState, useCallback, useRef } from 'react';

export default function ImageUploader({ onReset, appendMode, onAzureVision }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const analyze = useCallback(async (imgFile) => {
    if (!imgFile) return;
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(imgFile);
    reader.onloadend = async () => {
      const b64 = reader.result.split(',')[1];
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
  }, [onAzureVision, appendMode]);

  function handleCapture(e) {
    const f = e.target.files[0];
    if (f) analyze(f);
  }

  function handleRetake() {
    setImage(null);
    onReset && onReset();
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] mx-auto text-center">
      <div className="w-full flex items-center justify-between mb-4">
        <button
          className="text-blue-400 text-lg font-bold px-2 py-1 rounded hover:bg-blue-50 transition-all"
          onClick={handleRetake}
          aria-label="Back"
        >
          ← Back
        </button>
        {appendMode && (
          <span className="text-xs text-gray-400 ml-2">Append Mode</span>
        )}
      </div>
      {!image && (
        <button
          className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg active:scale-95 transition-all mb-6 mx-auto"
          onClick={() => inputRef.current.click()}
          aria-label="Open Camera"
        >
          {/* Friendly camera icon (smile) */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
            <circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="1.5" fill="#60a5fa" />
            <rect x="8.5" y="7.5" width="7" height="5" rx="2.5" fill="#fff" stroke="#fff" strokeWidth="0.5" />
            <circle cx="12" cy="10" r="1.5" fill="#60a5fa" />
            <path d="M9 14c.5 1 2.5 1 3 0" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
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
            style={{ aspectRatio: '1/1', background: '#eee' }}
          />
          <button
            className="text-blue-500 underline text-sm mb-2"
            onClick={handleRetake}
          >
            Retake Photo
          </button>
        </div>
      )}
      {loading && <div className="text-blue-400 mt-4">Analyzing…</div>}
    </div>
  );
}
