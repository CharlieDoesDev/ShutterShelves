import React, { useState, useEffect } from "react";
import { asyncProgressBar } from "../lib/Util.js";

export default function ProcessingWindow({ onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    asyncProgressBar((p) => {
      if (!cancelled) setProgress(p);
    }).then(() => {
      if (!cancelled) onDone();
    });
    return () => {
      cancelled = true;
    };
  }, [onDone]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Processing...</h2>
      <div
        style={{
          width: 200,
          height: 24,
          border: "1px solid #ccc",
          borderRadius: 8,
          margin: "16px auto",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#4f8cff",
            borderRadius: 8,
            transition: "width 0.2s",
          }}
        />
      </div>
      <div>{progress}%</div>
    </div>
  );
}
