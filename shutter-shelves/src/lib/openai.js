// In your unpacked helper (e.g. src/lib/api.js), replace cy() with:

const PROXY_URL = "https://pantry-pilot-proxy.shuttershells.workers.dev";

export async function proxyPost(payload) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    mode: "cors",                        // ensure CORS is allowed
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Read the raw text no matter what
  const text = await res.text();

  if (!res.ok) {
    // Throw full status + body so you see e.g. "Caption error 404: Not Found"
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }

  // Parse as JSON if OK
  return JSON.parse(text);
}
