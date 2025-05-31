import React from "react";

export default function CameraWindow({ onCapture, onCancel }) {
  // Handler for capture logic inside the component
  const handleCaptureClick = () => {
    // TODO: Replace with real image capture logic
    const imageData = "mock-image-data";
    onCapture(imageData);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Camera Window</h2>
      {/* Replace with actual camera logic or file input */}
      <button onClick={handleCaptureClick}>Capture</button>
      <button onClick={onCancel} style={{ marginLeft: 8 }}>
        Cancel
      </button>
    </div>
  );
}
