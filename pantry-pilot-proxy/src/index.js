import { OpenAI } from "openai";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { imageBase64, mode } = payload;
    if (!imageBase64 || !mode) {
      return new Response("Missing imageBase64 or mode", { status: 400 });
    }

    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      azure: {
        resourceName: env.AZURE_OPENAI_ENDPOINT.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        deploymentName: env.AZURE_OPENAI_DEPLOYMENT,
        apiVersion: env.AZURE_OPENAI_API_VERSION,
      },
    });

    let messages;
    if (mode === "items") {
      messages = [
        { role: "system", content: "Extract pantry item names from this image." },
        { role: "user", content: imageBase64, contentType: "image/png" },
      ];
    } else if (mode === "recipes") {
      messages = [
        { role: "system", content: "Given a JSON array of pantry items, return up to five recipe titles as JSON." },
        { role: "user", content: imageBase64 },
      ];
    } else {
      return new Response("Invalid mode", { status: 400 });
    }

    try {
      const resp = await client.chat.completions.create({
        model: env.AZURE_OPENAI_DEPLOYMENT,
        messages,
        temperature: mode === "items" ? 0 : 0.7,
        max_tokens: mode === "items" ? 200 : 150,
      });
      return new Response(resp.choices[0].message.content, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
