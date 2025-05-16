export default {
  async fetch(request, env) {
    // CORS helper
    const withCors = (response) => {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    };

    // 1. Preflight
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }
    if (request.method !== "POST") {
      return withCors(new Response("Method Not Allowed", { status: 405 }));
    }

    // 2. Parse payload
    let payload;
    try {
      payload = await request.json();
    } catch {
      return withCors(new Response("Invalid JSON", { status: 400 }));
    }
    const { imageBase64, mode } = payload;
    if (!imageBase64 || !mode) {
      return withCors(new Response("Missing imageBase64 or mode", { status: 400 }));
    }

    try {
      // 3. Caption via Salesforce/blip-image-captioning-base
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
        const errText = await capRes.text();
        return withCors(new Response(`Caption error ${capRes.status}: ${errText}`, { status: 502 }));
      }
      const capJson = await capRes.json();
      const caption = capJson[0]?.generated_text?.trim() || "";

      // 4. Build prompt for items or recipes
      let prompt, params;
      if (mode === "items") {
        prompt = `Extract pantry item names from this description:\n\n"${caption}"\n\nReturn a JSON array of strings.`;
        params = { max_new_tokens: 200, temperature: 0 };
      } else {  // recipes
        prompt = `Given these pantry items (JSON array), return up to five recipe titles as a JSON array:\n\n${imageBase64}`;
        params = { max_new_tokens: 150, temperature: 0.7 };
      }

      // 5. Generate with BloomZ
      const genRes = await fetch(
        "https://api-inference.huggingface.co/models/bigscience/bloomz-7b1-mt",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: params,
          }),
        }
      );
      if (!genRes.ok) {
        const errText = await genRes.text();
        return withCors(new Response(`Generation error ${genRes.status}: ${errText}`, { status: 502 }));
      }
      const genJson = await genRes.json();
      const generated = genJson[0]?.generated_text?.trim() || "[]";

      // 6. Extract JSON array from generated text
      const start = generated.indexOf("[");
      const end = generated.lastIndexOf("]") + 1;
      let result = [];
      if (start >= 0 && end > start) {
        try {
          result = JSON.parse(generated.slice(start, end));
        } catch {
          result = [];
        }
      }

      // 7. Return final result
      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch (err) {
      return withCors(
        new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  },
};
