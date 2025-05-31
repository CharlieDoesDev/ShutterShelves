import React, { useRef, useEffect } from "react";
import "./CameraWindow.css";

export default function CameraWindow({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Request camera access on mount
  useEffect(() => {
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
  }, [onCancel]);

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
    onCapture(dataUrl);
  };

  return (
    <div className="camera-window">
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12 }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ marginTop: 16 }}>
        <button onClick={handleCaptureClick}>Capture</button>
        <button onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
