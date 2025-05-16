// src/lib/feature.js
const PROXY = "https://pantry-pilot-proxy.shuttershells.workers.dev";

export function extractFeatures(text) {
  return fetch(`${PROXY}/feature-extract`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text }),
  })
    .then(async (res) => {
      const txt = await res.text();
      if (!res.ok) throw new Error(`Proxy FE error ${res.status}: ${txt}`);
      return JSON.parse(txt);
    });
}
