import React from "react";
import StyledButton from "./StyledButton";
import DisplayRecipes from "./Recipe/DisplayRecipes";
import SlideInLogo from "./SlideInLogo";

export default function IdleWindow({ onStart, recipes }) {
  return (
    <div
      className="idle-window"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      <SlideInLogo />
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <StyledButton onClick={onStart}>Start</StyledButton>
      </div>
      <div style={{ width: "100%", marginTop: "auto" }}>
        <DisplayRecipes recipes={recipes} />
      </div>
    </div>
  );
}
