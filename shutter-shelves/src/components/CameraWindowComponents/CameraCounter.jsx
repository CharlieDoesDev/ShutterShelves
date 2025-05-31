import React from "react";

export default function CameraCounter({ count }) {
  return (
    <div style={{
      position: "absolute",
      top: 12,
      right: 16,
      background: "rgba(0,0,0,0.6)",
      color: "#fff",
      borderRadius: "999px",
      padding: "4px 12px",
      fontWeight: 600,
      fontSize: 18,
      zIndex: 10,
      minWidth: 32,
      textAlign: "center"
    }}>
      {count}
    </div>
  );
}
