import { OpenAI } from "openai";

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
    let { imageBase64, mode } = await request.json().catch(() => ({  }));
    if (!imageBase64 || !mode) {
      return new Response("Missing imageBase64 or mode", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      // 3) Step 1: caption via Hugging Face
      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: imageBase64 }),
        }
      );
      if (!hfRes.ok) throw new Error(`HF ${hfRes.status}: ${await hfRes.text()}`);
      const hfJson = await hfRes.json();
      const caption = hfJson[0]?.generated_text || "";

      // 4) Step 2: GPT-4 Turbo for items or recipes
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      let messages, temperature, max_tokens;

      if (mode === "items") {
        messages = [
          { role: "system", content: "Extract pantry item names from this description." },
          { role: "user", content: caption },
        ];
        temperature = 0;
        max_tokens = 200;
      } else {
        messages = [
          { role: "system", content: "Given a JSON array of pantry items, return up to five recipe titles as a JSON array." },
          { role: "user", content: imageBase64 }, // here imageBase64 holds JSON-stringified items
        ];
        temperature = 0.7;
        max_tokens = 150;
      }

      const chat = await client.chat.completions.create({
        model: "gpt-4-turbo",
        messages,
        temperature,
        max_tokens,
      });

      const result = chat.choices?.[0]?.message?.content || "[]";
      return new Response(result, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
