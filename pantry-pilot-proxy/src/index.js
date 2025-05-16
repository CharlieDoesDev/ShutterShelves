// pantry-pilot-proxy/src/index.js

import { OpenAI } from "openai";

export default {
  async fetch(request, env) {
    // 1) Handle OPTIONS preflight
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

    // 2) Only allow POST thereafter
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 3) Parse JSON payload
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const { imageBase64, mode } = payload;
    if (!imageBase64 || !mode) {
      return new Response("Missing imageBase64 or mode", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 4) Init OpenAI client with secret from env
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      azure: {
        resourceName: env.AZURE_OPENAI_ENDPOINT
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, ""),
        deploymentName: env.AZURE_OPENAI_DEPLOYMENT,
        apiVersion: env.AZURE_OPENAI_API_VERSION,
      },
    });

    // 5) Build messages
    let messages;
    if (mode === "items") {
      messages = [
        { role: "system", content: "Extract pantry item names from this image." },
        { role: "user", content: imageBase64, contentType: "image/png" },
      ];
    } else {
      messages = [
        { role: "system", content: "Given a JSON array of pantry items, return up to five recipe titles as a JSON array." },
        { role: "user", content: imageBase64 },
      ];
    }

    // 6) Call OpenAI
    try {
      const resp = await client.chat.completions.create({
        model: env.AZURE_OPENAI_DEPLOYMENT,
        messages,
        temperature: mode === "items" ? 0 : 0.7,
        max_tokens: mode === "items" ? 200 : 150,
      });
      const body = resp.choices?.[0]?.message?.content || "[]";

      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
