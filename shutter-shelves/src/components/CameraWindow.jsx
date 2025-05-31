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

  // --- Styling ---
  const cameraWindowStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(245,247,255,0.85)",
    zIndex: 1000,
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.97)",
    borderRadius: 24,
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
    padding: 32,
    minWidth: 420,
    maxWidth: 700,
    width: "min(98vw, 700px)",
    minHeight: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden"
  };

  const buttonStyle = {
    fontSize: 15,
    padding: "14px 32px",
    borderRadius: 16,
    minWidth: 160,
    margin: "0 8px",
    background: "linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 2px 8px 0 rgba(99,102,241,0.10)",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.2s, box-shadow 0.2s",
    whiteSpace: "normal",
    wordBreak: "break-word",
    textAlign: "center",
    lineHeight: 1.2
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "#e5e7eb",
    color: "#374151",
    marginTop: 16
  };

  // --- Grid view ---
  if (showGrid) {
    return (
      <div style={cameraWindowStyle}>
        <div className="camera-window" style={{ ...cardStyle, minHeight: 520 }}>
          <h2 style={{ marginBottom: 8, fontWeight: 700, fontSize: 22 }}>Select Photos</h2>
          <div style={{ width: "100%", maxHeight: 320, overflowY: "auto", marginBottom: 16 }}>
            <PhotoGrid photos={photos} selected={selected} onToggle={handleToggle} buttonStyle={buttonStyle} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12, width: "100%", justifyContent: "center" }}>
            <button style={cancelButtonStyle} onClick={handleCancelGrid}>Back</button>
            <button style={buttonStyle} onClick={handleProcess} disabled={selected.length === 0}>
              Process Selected
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Camera view ---
  return (
    <div style={cameraWindowStyle}>
      <div className="camera-window" style={cardStyle}>
        <CameraCounter count={photos.length} />
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 18, marginBottom: 18, background: "#e5e7eb" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CameraCaptureButton onCapture={handleCaptureClick} buttonStyle={buttonStyle} />
          {photos.length > 0 && <FinishPhotosButton onFinish={handleFinish} buttonStyle={buttonStyle} />}
          <button style={cancelButtonStyle} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
