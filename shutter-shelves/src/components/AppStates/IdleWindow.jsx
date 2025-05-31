import React from "react";
import StyledButton from "../SimpleElements/StyledButton";
import DisplayRecipes from "../Recipe/DisplayRecipes";
import SlideInLogo from "../SimpleElements/SlideInLogo";
import CenterPanel from "../SimpleContainers/CenterPanel";
import "./IdleWindow.css";

export default function IdleWindow({ onStart, recipes }) {
  return (
    <div className="idle-window">
      <SlideInLogo />
      <CenterPanel>
        <div className="idle-start-btn-row">
          <StyledButton onClick={onStart}>Start</StyledButton>
        </div>
        <div className="idle-recipes-panel">
          <DisplayRecipes recipes={recipes} />
        </div>
      </CenterPanel>
    </div>
  );
}
