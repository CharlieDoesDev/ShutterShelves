export default function RecipeRecommendations({ recipes }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Top 5 Recipes</h2>
      <ol className="list-decimal list-inside mt-2 space-y-1">
        {recipes.map((r, i) => <li key={i}>{r}</li>)}
      </ol>
    </div>
  );
}