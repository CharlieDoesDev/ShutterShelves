export default function PantryResults({ items }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Identified Items</h2>
      <ul className="list-disc list-inside mt-2">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
