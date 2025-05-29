export default function RecipeRecommendations({ recipes }) {
  // recipes is now an array of strings (completions)
  return (
    <div>
      <h2 className="text-2xl font-semibold">Recipe Suggestions</h2>
      <div className="mt-2 space-y-4">
        {recipes.map((r, i) => (
          <div key={i} className="border rounded p-4 bg-white shadow whitespace-pre-line">
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}