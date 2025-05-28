export default function RecipeRecommendations({ recipes }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Top 5 Recipes</h2>
      <ol className="list-decimal list-inside mt-2 space-y-4">
        {recipes.map((r, i) => (
          <li key={i} className="border rounded p-4 bg-white shadow">
            <h3 className="font-bold text-lg mb-2">{r.title}</h3>
            <div>
              <span className="font-semibold">Ingredients:</span>
              <ul className="list-disc list-inside ml-4">
                {r.ingredients && r.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2">
              <span className="font-semibold">Steps:</span>
              <ol className="list-decimal list-inside ml-4">
                {r.steps && r.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}