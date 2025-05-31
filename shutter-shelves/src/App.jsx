import React, { useRef, useState } from "react";
import StyledButton from "./components/StyledButton";
import { handleImageUpload } from "./lib/imageUploader";
import CenterPanel from "./components/CenterPanel";
import { InitiateImages } from "./lib/App.js";

export default function App() {
  const [images, setImages] = useState([]);
  const inputRef = useRef();

  async function onFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = await handleImageUpload(files);
    const withAnalysis = newImages.map((img) => {
      const analysis = generateAnalysis();
      return {
        ...img,
        analysis,
        recipes: generateRecipes(analysis),
      };
    });
    setImages((prev) => [...prev, ...withAnalysis]);
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleReset() {
    setImages([]);
  }

  function generateAnalysis() {
    const items = [
      "canned beans",
      "pasta",
      "tomato sauce",
      "olive oil",
      "salt",
      "pepper",
      "rice",
      "spices",
    ];
    const count = Math.floor(Math.random() * 4) + 3;
    return items.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  function generateRecipes(analysis) {
    return [
      {
        title: "Pantry Pasta",
        ingredients: analysis.slice(0, 3),
        steps: ["Boil pasta.", "Heat sauce.", "Combine and serve."],
      },
      {
        title: "Quick Rice Bowl",
        ingredients: analysis.slice(0, 2),
        steps: ["Cook rice.", "Add toppings.", "Enjoy!"],
      },
    ];
  }

  return (
    <div>
      <CenterPanel>
        <StyledButton onClick={InitiateImages}></StyledButton>
      </CenterPanel>
    </div>
  );
}
