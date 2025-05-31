import React from "react";
import StyledButton from "../StyledButton";

export default function FinishPhotosButton({ onFinish, disabled }) {
  return (
    <StyledButton
      onClick={onFinish}
      disabled={disabled}
      style={{ margin: "0 auto", display: "block", marginTop: 16 }}
    >
      Finish Taking Photos
    </StyledButton>
  );
}
