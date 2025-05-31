import React from "react";

export default function PhotoGrid({ photos, selected, onToggle }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 16,
      marginTop: 16,
      width: "100%"
    }}>
      {photos.map((photo, idx) => {
        const isSelected = selected.includes(idx);
        return (
          <div key={idx} style={{ position: "relative" }}>
            <img
              src={photo.dataUrl || photo}
              alt={`Photo ${idx + 1}`}
              style={{
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 12,
                border: isSelected ? "3px solid #6366f1" : "2px solid #e5e7eb",
                boxShadow: isSelected ? "0 0 0 2px #6366f1" : undefined,
                objectFit: "cover"
              }}
            />
            <div
              onClick={() => onToggle(idx)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: isSelected ? "#6366f1" : "#fff",
                border: "2px solid #6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2
              }}
              aria-label={isSelected ? "Deselect" : "Select"}
            >
              {isSelected ? (
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff" }} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
