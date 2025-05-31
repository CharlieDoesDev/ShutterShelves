import React, { useRef, useEffect, useState } from "react";
import "./CameraWindow.css";
import CameraCounter from "./CameraWindowComponents/CameraCounter";
import CameraCaptureButton from "./CameraWindowComponents/CameraCaptureButton";
import FinishPhotosButton from "./CameraWindowComponents/FinishPhotosButton";
import PhotoGrid from "./CameraWindowComponents/PhotoGrid";

export default function CameraWindow({ onCapture, onCancel, onProcess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [selected, setSelected] = useState([]);

  // Request camera access on mount
  useEffect(() => {
    if (showGrid) return;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
  const handleProcess = () => {
    const selectedPhotos = selected.map((i) => photos[i]);
    if (onProcess) onProcess(selectedPhotos);
    if (onCapture) onCapture(selectedPhotos);
  };

  // Cancel from grid view
  const handleCancelGrid = () => {
    setShowGrid(false);
  };

  if (showGrid) {
    return (
      <div className="camera-window" style={{ position: "relative" }}>
        <h2 style={{ marginBottom: 8 }}>Select Photos</h2>
        <PhotoGrid photos={photos} selected={selected} onToggle={handleToggle} />
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={handleCancelGrid}>Back</button>
          <button onClick={handleProcess} disabled={selected.length === 0}>
            Process Selected
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-window" style={{ position: "relative" }}>
      <CameraCounter count={photos.length} />
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12 }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <CameraCaptureButton onCapture={handleCaptureClick} />
      {photos.length > 0 && <FinishPhotosButton onFinish={handleFinish} />}
      <button onClick={onCancel} style={{ marginTop: 16 }}>
        Cancel
      </button>
    </div>
  );
}
