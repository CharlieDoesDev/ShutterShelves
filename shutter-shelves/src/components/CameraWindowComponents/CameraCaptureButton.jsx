import React from "react";
import StyledButton from "../SimpleElements/StyledButton";

export default function CameraCaptureButton({ onCapture, disabled }) {
  return (
    <StyledButton
      onClick={onCapture}
      disabled={disabled}
      style={{ margin: "0 auto", display: "block", marginTop: 24 }}
    >
      Capture Photo
    </StyledButton>
  );
}
