import React, { useState } from "react";
import StyledButton from "./components/StyledButton";
import CenterPanel from "./components/CenterPanel";
import { InitiateImages } from "./lib/App.js";
import {
  generateAnalysis,
  generateRecipes,
  removeImage,
  handleReset,
  onFileChange,
} from "./lib/Util.js";

// Mode constants
const MODE_IDLE = "idle";
const MODE_TAKING_PICTURE = "taking-picture";
const MODE_PROCESSING = "processing";

export default function App() {
  const [images, setImages] = useState([]);
  const [mode, setMode] = useState(MODE_IDLE);

  return (
    <div className="App">
      <CenterPanel>
        {/* Example usage of mode constants */}
        {mode === MODE_IDLE && (
          <StyledButton onClick={() => setMode(MODE_TAKING_PICTURE)}>
            Start
          </StyledButton>
        )}
        {mode === MODE_TAKING_PICTURE && <div>Picture Taking Mode</div>}
        {mode === MODE_PROCESSING && <div>Processing...</div>}
      </CenterPanel>
    </div>
  );
}
