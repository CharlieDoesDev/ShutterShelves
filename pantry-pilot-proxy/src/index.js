export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    let { imageBase64, mode } = await request.json().catch(() => ({}));
    if (!imageBase64 || !mode) {
      return new Response("Missing imageBase64 or mode", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    // 1) Caption with BLIP
    const capRes = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: imageBase64 })
      }
    );
    if (!capRes.ok) {
      const text = await capRes.text();
      return new Response(`Caption error ${capRes.status}: ${text}`, { status: 502 });
    }
    const capJson = await capRes.json();
    const caption = capJson[0]?.generated_text ?? "";

    try {
      // 2) Generation with BloomZ
      let prompt, model;
      if (mode === "items") {
        model = "bigscience/bloomz-7b1-mt";
        prompt = `Extract pantry item names from this description:\n\n"${caption}"\n\nReturn a JSON array of strings.`;
      } else {
        model = "bigscience/bloomz-7b1-mt";
        prompt = `Given these pantry items (as JSON array), return up to five recipe titles as a JSON array:\n\n${imageBase64}`;
      }

      const genRes = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.HF_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 150, temperature: mode === "items" ? 0 : 0.7 }
          })
        }
      );
      if (!genRes.ok) {
        const text = await genRes.text();
        return new Response(`Generation error ${genRes.status}: ${text}`, { status: 502 });
      }
      const genJson = await genRes.json();
      // HF returns an array of { generated_text }
      const text = genJson[0].generated_text.trim();

      // Extract the JSON array from the generated text
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]") + 1;
      const jsonStr = start >= 0 && end > start ? text.slice(start, end) : "[]";
      const result = JSON.parse(jsonStr);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
