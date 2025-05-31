import React from "react";
import "./StyledButton.css";

export default function StyledButton({
  children,
  onClick,
  className = "",
  imagePath = "",
  ...props
}) {
  // Keyboard accessibility: trigger onClick for Enter/Space
  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onClick) onClick(e);
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`styled-btn styled-btn-circle ${className}`}
      {...props}
    >
      {imagePath && imagePath.length > 0 ? (
        <img
          src={imagePath}
          alt="Button preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      ) : (
        children || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-10 h-10"
          >
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke="#fff"
              strokeWidth="1.5"
              fill="#60a5fa"
            />
            <rect
              x="8.5"
              y="7.5"
              width="7"
              height="5"
              rx="2.5"
              fill="#fff"
              stroke="#fff"
              strokeWidth="0.5"
            />
            <circle cx="12" cy="10" r="1.5" fill="#60a5fa" />
            <path
              d="M9 14c.5 1 2.5 1 3 0"
              stroke="#fff"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        )
      )}
    </div>
  );
}
