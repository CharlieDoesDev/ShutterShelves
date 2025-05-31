import React from "react";
import StyledButton from "./StyledButton";

export default function CookbookButton({ onClick }) {
  return (
    <StyledButton
      className="cookbook-btn"
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 2000,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 10,
        boxShadow: "0 2px 8px #0001",
        cursor: "pointer",
        minWidth: 0,
        minHeight: 0,
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClick}
      aria-label="View Cookbook"
    >
      <span role="img" aria-label="Cookbook" style={{ fontSize: 24 }}>
        📖
      </span>
    </StyledButton>
  );
}
