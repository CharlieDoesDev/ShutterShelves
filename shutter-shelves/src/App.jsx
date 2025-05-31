import React, { useState, useEffect } from "react";
import StyledButton from "./components/StyledButton";
import CenterPanel from "./components/CenterPanel";
import CameraWindow from "./components/CameraWindow";
import ProcessingWindow from "./components/ProcessingWindow";
import { asyncProgressBar } from "./lib/Util.js";
import SlideInLogo from "./components/SlideInLogo";

// Mode constants
const MODE_IDLE = "idle";
const MODE_TAKING_PICTURE = "taking-picture";
const MODE_PROCESSING = "processing";

export default function App() {
  const [images, setImages] = useState([]);
  const [mode, setMode] = useState(MODE_IDLE);

  // Handler for when a picture is captured
  const handleCapture = (imageData) => {
    setImages((prev) => [...prev, imageData]);
    setMode(MODE_PROCESSING);
  };

  // Handler for canceling camera
  const handleCancel = () => setMode(MODE_IDLE);
  const handleProcessingDone = () => setMode(MODE_IDLE);

  return (
    <div className="Container">
      <SlideInLogo />
      {mode === MODE_IDLE && (
        <CenterPanel>
          <StyledButton onClick={() => setMode(MODE_TAKING_PICTURE)}>
            Start
          </StyledButton>
        </CenterPanel>
      )}
      {mode === MODE_TAKING_PICTURE && (
        <CenterPanel>
          <CameraWindow onCapture={handleCapture} onCancel={handleCancel} />
        </CenterPanel>
      )}
      {mode === MODE_PROCESSING && (
        <CenterPanel>
          <ProcessingWindow onDone={handleProcessingDone} />
        </CenterPanel>
      )}
    </div>
  );
}
