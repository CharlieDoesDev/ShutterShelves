import React, { useRef, useEffect, useState } from "react";
import "./CameraWindow.css";
import CameraCounter from "../CameraWindowComponents/CameraCounter";
import CameraCaptureButton from "../CameraWindowComponents/CameraCaptureButton";
import FinishPhotosButton from "../CameraWindowComponents/FinishPhotosButton";
import PhotoGrid from "../CameraWindowComponents/PhotoGrid";
import {
  getNextDownsampleFactor,
  downsampleDataUrl,
  DOWNSAMPLE_FACTORS,
} from "../../lib/imageProcessing";
import { dataUrlToBase64Object } from "../../lib/imageUploader";

const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";

async function extractPantryItemsFromGemini(base64Array) {
  const res = await fetch(`${PROXY}/pantry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagesBase64: base64Array }),
  });
  if (!res.ok) throw new Error("Gemini pantry error: " + res.status);
  return res.json(); // array of items
}

async function getGeminiRecipes(items) {
  // Improved prompt for Gemini to return only JSON
  const prompt = `Given these pantry items, generate 5 creative recipes as a JSON array of objects. Respond ONLY with a JSON array of recipe objects, no markdown, no explanation, no code block, no extra text. Each object should have \"Title\", \"Ingredients\", and \"Instructions\" fields.`;
  const res = await fetch(`${PROXY}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, prompt }),
  });
  if (!res.ok) throw new Error("Gemini recipe error: " + res.status);
  const data = await res.json();
  return data.completion;
}

export default function CameraWindow({ onCapture, onCancel, onProcess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [selected, setSelected] = useState([]);
  const [downsample, setDownsample] = useState(1);

  // Request camera access on mount
  useEffect(() => {
    if (showGrid) return;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Unable to access camera: " + err.message);
        onCancel();
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel, showGrid]);

  // Capture image from video
  const handleCaptureClick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setPhotos((prev) => [...prev, { dataUrl }]);
  };

  // Finish taking photos, show grid
  const handleFinish = () => {
    setShowGrid(true);
    setSelected(photos.map((_, i) => i)); // select all by default
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // Toggle selection in grid
  const handleToggle = (idx) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Process selected photos
  const handleProcess = async () => {
    // Downsample all selected photos according to the selected downsample factor
    const selectedPhotos = await Promise.all(
      selected.map(async (i) => {
        const photo = photos[i];
        if (downsample !== 1) {
          const dataUrl = await downsampleDataUrl(photo.dataUrl, downsample);
          return { ...photo, dataUrl };
        }
        return photo;
      })
    );
    // Convert all selected photos to base64
    const base64Array = selectedPhotos.map(
      (photo) => dataUrlToBase64Object(photo.dataUrl).base64
    );
    if (base64Array.length > 0) {
      try {
        const pantryItems = await extractPantryItemsFromGemini(base64Array);
        const recipesText = await getGeminiRecipes(pantryItems);
        if (onProcess)
          onProcess({ pantryItems, recipesText, images: selectedPhotos });
        if (onCapture) onCapture(selectedPhotos);
      } catch (err) {
        alert("Gemini API error: " + err.message);
      }
    } else {
      if (onProcess) onProcess([]);
      if (onCapture) onCapture([]);
    }
  };

  // Cancel from grid view
  const handleCancelGrid = () => {
    setShowGrid(false);
  };

  // --- Grid view ---
  if (showGrid) {
    return (
      <div className="camera-window-overlay">
        <div className="camera-window card-grid">
          <h2 className="camera-window-title">Select Photos</h2>
          <div className="photo-grid-container">
            <PhotoGrid
              photos={photos}
              selected={selected}
              onToggle={handleToggle}
            />
            {/* Plus button for uploading more images */}
            <button
              className="plus-upload-btn"
              title="Add more photos"
              onClick={() => {
                // Focus and trigger the file input for accessibility
                const input = document.getElementById("photo-upload-input");
                if (input) {
                  input.value = ""; // Always reset so same file can be re-uploaded
                  input.click();
                }
              }}
              aria-label="Add more photos"
              tabIndex={0}
              type="button"
            >
              <span aria-hidden="true">+</span>
              <input
                id="photo-upload-input"
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                tabIndex={-1}
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  if (!files.length) return;
                  const newPhotos = await Promise.all(
                    files.map(
                      (file) =>
                        new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            resolve({ dataUrl: ev.target.result });
                          reader.readAsDataURL(file);
                        })
                    )
                  );
                  setPhotos((prev) => [...prev, ...newPhotos]);
                  setSelected((prev) => [
                    ...prev,
                    ...newPhotos.map((_, i) => prev.length + i),
                  ]);
                  e.target.value = ""; // reset input
                }}
              />
            </button>
          </div>
          <div className="downsample-row">
            <span className="downsample-label">Downsample:</span>
            <select
              value={downsample}
              onChange={(e) => setDownsample(Number(e.target.value))}
              className="downsample-select"
            >
              {[0.25, 0.5, 0.75, 0.85, 0.95, 1].map((f) => (
                <option key={f} value={f}>
                  {f}x
                </option>
              ))}
            </select>
          </div>
          <div className="camera-window-btn-row">
            <button className="camera-cancel-btn" onClick={handleCancelGrid}>
              Back
            </button>
            <button
              className="camera-process-btn"
              onClick={handleProcess}
              disabled={selected.length === 0}
            >
              Process Selected
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Camera view ---
  return (
    <div className="camera-window-overlay">
      <div className="camera-window card-view">
        <CameraCounter count={photos.length} />
        <video ref={videoRef} autoPlay playsInline className="camera-video" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="camera-btn-col">
          <button className="camera-capture-btn" onClick={handleCaptureClick}>
            Capture Photo
          </button>
          {photos.length > 0 && (
            <button className="camera-finish-btn" onClick={handleFinish}>
              Finish Taking Photos
            </button>
          )}
          <button className="camera-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
