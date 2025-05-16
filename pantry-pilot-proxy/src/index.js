export default {
  async fetch(request, env) {
    // 1) CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 2) Parse payload
    let { imageBase64, mode } = await request.json().catch(() => ({}));
    if (!imageBase64 || !mode) {
      return new Response("Missing imageBase64 or mode", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 3) Caption via Hugging Face
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
      return new Response(`Caption error ${capRes.status}: ${text}`, {
        status: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    const capJson = await capRes.json();
    const caption = capJson[0]?.generated_text ?? "";

    // 4) Generate with BloomZ (HF’s free model)
    let prompt, params;
    if (mode === "items") {
      prompt = `Extract pantry item names from this description:\n\n"${caption}"\n\nReturn a JSON array of strings.`;
      params = { max_new_tokens: 200, temperature: 0 };
    } else {
      prompt = `Given these pantry items (JSON array), return up to five recipe titles as a JSON array:\n\n${imageBase64}`;
      params = { max_new_tokens: 150, temperature: 0.7 };
    }

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
      return new Response(`Generation error ${genRes.status}: ${text}`, {
        status: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    const genJson = await genRes.json();
    const text = genJson[0]?.generated_text?.trim() || "[]";

    // 5) Safely extract JSON array
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]") + 1;
    let result = [];
    try {
      if (start >= 0 && end > start) {
        result = JSON.parse(text.slice(start, end));
      }
    } catch { /* fall through */ }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
