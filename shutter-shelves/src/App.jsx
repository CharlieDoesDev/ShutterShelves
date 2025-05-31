import React, { useState, useEffect } from "react";
import StyledButton from "./components/StyledButton";
import CenterPanel from "./components/CenterPanel";
import CameraWindow from "./components/CameraWindow";
import ProcessingWindow from "./components/ProcessingWindow";
import DisplayOutput from "./components/DisplayOutput";
import {
  asyncProgressBar,
  generateAnalysis,
  generateRecipes,
} from "./lib/Util.js";
import SlideInLogo from "./components/SlideInLogo";

// Mode constants
const MODE_IDLE = "idle";
const MODE_TAKING_PICTURE = "taking-picture";
const MODE_PROCESSING = "processing";
const MODE_DISPLAY_OUTPUT = "display-output";

export default function App() {
  const [images, setImages] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [mode, setMode] = useState(MODE_IDLE);

  // Handler for when a picture is captured
  const handleCapture = (imageData) => {
    setImages((prev) => [...prev, imageData]);
    setMode(MODE_PROCESSING);
  };

  // Handler for canceling camera
  const handleCancel = () => setMode(MODE_IDLE);

  // Handler for when processing is done
  const handleProcessingDone = () => {
    // Generate recipes using Util.js
    const analysis = generateAnalysis();
    const generated = generateRecipes(analysis);
    setRecipes(generated);
    setMode(MODE_DISPLAY_OUTPUT);
  };

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
      {mode === MODE_DISPLAY_OUTPUT && (
        <CenterPanel>
          <DisplayOutput recipes={recipes} />
        </CenterPanel>
      )}
    </div>
  );
}
