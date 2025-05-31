import React from "react";

export default function DisplayOutput({ images }) {
  return (
    <div className="display-output" style={{ textAlign: "center" }}>
      <h2>Results</h2>
      {images && images.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {images.map((img, idx) => (
            <div key={idx} style={{ margin: 8 }}>
              {/* If imageData is a URL or base64, use as src. Otherwise, show placeholder. */}
              {img && img !== "mock-image-data" ? (
                <img
                  src={img}
                  alt={`Captured ${idx + 1}`}
                  style={{
                    maxWidth: 160,
                    maxHeight: 160,
                    borderRadius: 8,
                    boxShadow: "0 2px 8px #0001",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 160,
                    height: 160,
                    background: "#eee",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#888" }}>No Image</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>No images to display.</div>
      )}
    </div>
  );
}
