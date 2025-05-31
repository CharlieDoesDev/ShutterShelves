import React, { useState, useEffect } from "react";
import "./ProcessingWindow.css";
import { asyncProgressBar } from "../../lib/Util.js";

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
    <div className="processing-window">
      <h2>Processing...</h2>
      <div className="progress-bar">
        <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
      </div>
      <div>{progress}%</div>
    </div>
  );
}
