import React, { useEffect, useRef } from "react";
import "./SlideInLogo.css";

export default function SlideInLogo() {
  const logoRef = useRef(null);

  useEffect(() => {
    // Trigger the slide-in animation after mount
    if (logoRef.current) {
      logoRef.current.classList.add("slide-in-logo--active");
    }
  }, []);

  return (
    <div ref={logoRef} className="slide-in-logo">
      {/* You can replace this with an actual logo image or SVG later */}
    </div>
  );
}
