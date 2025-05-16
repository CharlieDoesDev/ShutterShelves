export default {
  async fetch(request, env) {
    // CORS helper
    const withCors = (response) => {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    };

    const url = new URL(request.url);
    const path = url.pathname;

    // 1) Preflight
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }
    if (request.method !== "POST") {
      return withCors(new Response("Method Not Allowed", { status: 405 }));
    }

    // 2) Dispatch based on path
    try {
      if (path === "/pantry") {
        // Extract pantry items from image → caption via HF → parse JSON
        const { imageBase64 } = await request.json();
        if (!imageBase64) {
          return withCors(new Response("Missing imageBase64", { status: 400 }));
        }

        // Caption
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
          const err = await capRes.text();
          return withCors(new Response(`Caption error ${capRes.status}: ${err}`, { status: 502 }));
        }
        const [{ generated_text: caption }] = await capRes.json();

        // Extract items via BloomZ
        const prompt = `Extract pantry item names from this description:\n\n"${caption}"\n\nReturn a JSON array of strings.`;
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
              parameters: { max_new_tokens: 200, temperature: 0 },
            }),
          }
        );
        if (!genRes.ok) {
          const err = await genRes.text();
          return withCors(new Response(`Item-gen error ${genRes.status}: ${err}`, { status: 502 }));
        }
        const [{ generated_text }] = await genRes.json();
        const items = JSON.parse(
          generated_text.slice(
            generated_text.indexOf("["), 
            generated_text.lastIndexOf("]") + 1
          )
        );
        return withCors(new Response(JSON.stringify(items), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      else if (path === "/recipes") {
        // Recommend recipes from item list
        const { items } = await request.json();
        if (!Array.isArray(items)) {
          return withCors(new Response("Missing items array", { status: 400 }));
        }

        const prompt = `Given these pantry items (JSON array), return up to five recipe titles as a JSON array:\n\n${JSON.stringify(items)}`;
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
              parameters: { max_new_tokens: 150, temperature: 0.7 },
            }),
          }
        );
        if (!genRes.ok) {
          const err = await genRes.text();
          return withCors(new Response(`Recipe-gen error ${genRes.status}: ${err}`, { status: 502 }));
        }
        const [{ generated_text }] = await genRes.json();
        const recipes = JSON.parse(
          generated_text.slice(
            generated_text.indexOf("["), 
            generated_text.lastIndexOf("]") + 1
          )
        );
        return withCors(new Response(JSON.stringify(recipes), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      else if (path === "/feature-extract") {
        // Feature extraction route expects { inputs: ... }
        const { inputs } = await request.json().catch(() => ({}));
        if (!inputs) {
          return withCors(new Response("Missing inputs key", { status: 400 }));
        }
        const hfRes = await fetch(
          "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct/pipeline/feature-extraction",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.HF_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs }),
          }
        );
        const text = await hfRes.text();
        if (!hfRes.ok) {
          return withCors(new Response(`HF error ${hfRes.status}: ${text}`, { status: 502 }));
        }
        return withCors(new Response(text, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      else {
        return withCors(new Response("Not Found", { status: 404 }));
      }
    } catch (err) {
      // catch-all
      return withCors(new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }));
    }
  },
};
