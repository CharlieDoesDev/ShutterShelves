export default {
  async fetch(request, env) {
    // Helper to attach CORS headers
    function withCors(response) {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    }

    // 1) Preflight
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    // Wrap entire logic so all returns get CORS
    try {
      if (request.method !== "POST") {
        return withCors(new Response("Method Not Allowed", { status: 405 }));
      }

      const { imageBase64, mode } = await request.json().catch(() => ({}));
      if (!imageBase64 || !mode) {
        return withCors(new Response("Missing imageBase64 or mode", { status: 400 }));
      }

      // 2) Caption via HF
      const capRes = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: imageBase64 }),
        }
      );
      if (!capRes.ok) {
        const text = await capRes.text();
        return withCors(new Response(`Caption error ${capRes.status}: ${text}`, { status: 502 }));
      }
      const capJson = await capRes.json();
      const caption = capJson[0]?.generated_text ?? "";

      // 3) BloomZ generation
      const prompt =
        mode === "items"
          ? `Extract pantry item names from this description:\n\n"${caption}"\n\nReturn a JSON array of strings.`
          : `Given these pantry items (JSON array), return up to five recipe titles as a JSON array:\n\n${imageBase64}`;
      const params = mode === "items"
        ? { max_new_tokens: 200, temperature: 0 }
        : { max_new_tokens: 150, temperature: 0.7 };

      const genRes = await fetch(
        "https://api-inference.huggingface.co/models/bigscience/bloomz-7b1-mt",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt, parameters: params }),
        }
      );
      if (!genRes.ok) {
        const text = await genRes.text();
        return withCors(new Response(`Generation error ${genRes.status}: ${text}`, { status: 502 }));
      }
      const genJson = await genRes.json();
      const text = genJson[0]?.generated_text?.trim() || "[]";

      // 4) Extract JSON array
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]") + 1;
      let result = [];
      try {
        if (start >= 0 && end > start) {
          result = JSON.parse(text.slice(start, end));
        }
      } catch (e) {
        // ignore parse errors
      }

      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch (e) {
      // Catch-all unexpected errors
      return withCors(
        new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  },
};
