import React, { useState } from "react";
import CenterPanel from "./components/SimpleContainers/CenterPanel";
import CameraWindow from "./components/AppStates/CameraWindow.jsx";
import ProcessingWindow from "./components/AppStates/ProcessingWindow.jsx";
import IdleWindow from "./components/AppStates/IdleWindow.jsx";
import DisplayOutput from "./components/AppStates/DisplayOutput.jsx";
import {
  asyncProgressBar,
  generateAnalysis,
  generateRecipes,
} from "./lib/Util.js";
import CookbookButton from "./components/SimpleElements/CookbookButton";
import CookbookView from "./components/AppStates/CookbookView";
import RecipeView from "./components/AppStates/RecipeView";

// Mode constants
const MODE_IDLE = "idle";
const MODE_TAKING_PICTURE = "taking-picture";
const MODE_PROCESSING = "processing";
const MODE_DISPLAY_OUTPUT = "display-output";
const MODE_COOKBOOK = "cookbook";
const MODE_RECIPE_VIEW = "recipe-view";

export default function App() {
  const [images, setImages] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [mode, setMode] = useState(MODE_IDLE);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [envSequence, setEnvSequence] = useState(() => {
    const stored = window.localStorage.getItem("envSequence");
    if (stored && stored.length > 0) return stored;
    const input = window.prompt("Please enter your environment sequence:", "");
    if (input !== null && input.length > 0) {
      window.localStorage.setItem("envSequence", input);
      return input;
    }
    return "";
  });

  // Handler for when a picture is captured
  const handleCapture = (imageData) => {
    setImages(Array.isArray(imageData) ? imageData : [imageData]);
    setMode(MODE_PROCESSING);
  };

  // Handler for Gemini processing results (from ProcessingWindow)
  const handleGeminiProcess = ({ pantryItems, recipesText, images }) => {
    setImages(images || []);
    let parsedRecipes = [];
    try {
      parsedRecipes = JSON.parse(recipesText);
      if (!Array.isArray(parsedRecipes)) parsedRecipes = [parsedRecipes];
    } catch {
      parsedRecipes = [{ title: "Recipes", ingredients: pantryItems || [], steps: [recipesText] }];
    }
    setRecipes(parsedRecipes);
    setMode(MODE_DISPLAY_OUTPUT);
  };

  // Handler for canceling camera
  const handleCancel = () => setMode(MODE_IDLE);

  // Handler for when processing is done
  const handleProcessingDone = () => {
    // Generate recipes using Util.js
    const analysis = generateAnalysis();
    const generated = generateRecipes(analysis);
    setRecipes(generated);
    setMode(MODE_DISPLAY_OUTPUT);
  };

  // Save recipe handler
  const handleSaveRecipe = (recipe) => {
    if (!savedRecipes.some((r) => r.title === recipe.title)) {
      setSavedRecipes((prev) => [...prev, recipe]);
    }
  };

  // Cookbook navigation
  const handleViewCookbook = () => setMode(MODE_COOKBOOK);
  const handleViewRecipe = (recipe) => {
    setActiveRecipe(recipe);
    setMode(MODE_RECIPE_VIEW);
  };

  return (
    <div className="Container">
      {/* Cookbook button, always top right */}
      <CookbookButton onClick={handleViewCookbook} />
      {mode === MODE_IDLE && (
        <IdleWindow
          onStart={() => setMode(MODE_TAKING_PICTURE)}
          recipes={recipes}
        />
      )}
      {mode === MODE_TAKING_PICTURE && (
        <CameraWindow onCapture={handleCapture} onCancel={handleCancel} />
      )}
      {mode === MODE_PROCESSING && (
        <ProcessingWindow images={images} onProcessed={handleGeminiProcess} onDone={() => {}} />
      )}
      {mode === MODE_DISPLAY_OUTPUT && (
        <CenterPanel>
          <DisplayOutput
            recipes={recipes}
            onNext={() => setMode(MODE_IDLE)}
            onSaveRecipe={handleSaveRecipe}
            savedRecipes={savedRecipes}
          />
        </CenterPanel>
      )}
      {mode === MODE_COOKBOOK && (
        <CenterPanel>
          <CookbookView
            recipes={savedRecipes}
            onViewRecipe={handleViewRecipe}
            onBack={() => setMode(MODE_IDLE)}
          />
        </CenterPanel>
      )}
      {mode === MODE_RECIPE_VIEW && activeRecipe && (
        <CenterPanel>
          <RecipeView
            recipe={activeRecipe}
            onBack={() => setMode(MODE_COOKBOOK)}
            isSaved={savedRecipes.some((r) => r.title === activeRecipe.title)}
            onSave={handleSaveRecipe}
          />
        </CenterPanel>
      )}
    </div>
  );
}
