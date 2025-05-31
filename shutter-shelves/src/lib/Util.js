// InitiateImages: placeholder for app-wide image initiation logic
export function InitiateImages() {
  // TODO: Implement your app-wide image initiation logic here
  alert("InitiateImages called!");
}

// generateAnalysis: returns a random selection of pantry items
export function generateAnalysis() {
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

// generateRecipes: returns sample recipes based on analysis
export function generateRecipes(analysis) {
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

// removeImage: removes an image by index from the images array
export function removeImage(images, idx) {
  return images.filter((_, i) => i !== idx);
}

// handleReset: returns an empty images array
export function handleReset() {
  return [];
}

// onFileChange: handles the file input change event
export async function onFileChange(
  e,
  setImages,
  generateAnalysis,
  generateRecipes,
  handleImageUpload
) {
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

// Simulate an async progress bar for demo purposes
export async function asyncProgressBar(onProgress) {
  let progress = 0;
  while (progress < 100) {
    await new Promise((resolve) =>
      setTimeout(resolve, 30 + Math.random() * 70)
    );
    progress += Math.floor(Math.random() * 10) + 1;
    if (progress > 100) progress = 100;
    onProgress(progress);
  }
  return true;
}

// Simulate an async image processing request with progress callback
export async function DemoImageRequest(images, onProgress) {
  let progress = 0;
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );
    progress = Math.round((i / steps) * 100);
    onProgress(progress);
  }
  // Simulate processed images result (could be modified images, analysis, etc.)
  return images.map((img, idx) => ({ ...img, processed: true, id: idx }));
}
