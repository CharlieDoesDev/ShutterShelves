import React from "react";
import "./StyledButton.css";

export default function StyledButton({
  children,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`styled-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
