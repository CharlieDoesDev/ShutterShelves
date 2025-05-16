export default {
  async fetch(request, env) {
    // CORS helper
    const withCors = res => {
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return res;
    };

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }
    if (request.method !== "POST") {
      return withCors(new Response("Method Not Allowed", { status: 405 }));
    }

    // Parse incoming JSON
    let payload;
    try {
      payload = await request.json();
    } catch {
      return withCors(new Response("Invalid JSON", { status: 400 }));
    }

    // Forward to HF feature-extraction endpoint
    try {
      const hfRes = await fetch(
        "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct/pipeline/feature-extraction",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const text = await hfRes.text();
      if (!hfRes.ok) {
        return withCors(new Response(`HF error ${hfRes.status}: ${text}`, { status: 502 }));
      }
      // Return parsed JSON
      const json = JSON.parse(text);
      return withCors(
        new Response(JSON.stringify(json), {
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch (e) {
      return withCors(
        new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  },
};
