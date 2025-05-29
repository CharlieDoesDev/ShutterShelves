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
        // Extract pantry items from image → caption via Gemini → parse JSON
        const { imageBase64 } = await request.json();
        if (!imageBase64) {
          return withCors(new Response("Missing imageBase64", { status: 400 }));
        }

        // Gemini Vision API: Image to Caption
        const geminiVisionRes = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: "Describe this image in one sentence." },
                    { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                  ]
                }
              ]
            })
          }
        );
        if (!geminiVisionRes.ok) {
          const err = await geminiVisionRes.text();
          return withCors(new Response(`Caption error ${geminiVisionRes.status}: ${err}`, { status: 502 }));
        }
        const visionData = await geminiVisionRes.json();
        const caption = visionData.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Gemini Text API: Extract pantry items from caption
        const prompt = `"You are an intelligent culinary assistant tasked with analyzing a photo of pantry contents. Carefully identify each visible food item, including spices, canned goods, grains, sauces, snacks, and any other visible ingredients. After accurately listing these items, generate a practical set of at least five recipes that can be made primarily using the identified pantry ingredients. Ensure recipes vary in type (e.g., snacks, meals, desserts) and clearly state any additional ingredients or basic kitchen staples (such as salt, oil, or eggs) that might be required."
Return your answer as a single JSON array of strings, with each string being a specific, quantitative ingredient. Do not include any text or explanation outside the JSON array.

Description:
"${caption}"`;
        const geminiTextRes = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: prompt }] }
              ]
            })
          }
        );
        if (!geminiTextRes.ok) {
          const err = await geminiTextRes.text();
          return withCors(new Response(`Item-gen error ${geminiTextRes.status}: ${err}`, { status: 502 }));
        }
        const textData = await geminiTextRes.json();
        const generated = textData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        let items = [];
        try {
          items = JSON.parse(
            generated.slice(
              generated.indexOf("["),
              generated.lastIndexOf("]") + 1
            )
          );
        } catch (e) {
          items = [];
        }
        return withCors(new Response(JSON.stringify(items), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      else if (path === "/recipes") {
        // Recommend recipes from item list using Gemini
        const { items } = await request.json();
        if (!Array.isArray(items)) {
          return withCors(new Response("Missing items array", { status: 400 }));
        }
        const prompt = `Given ONLY these pantry ingredients (as a JSON array):\n${JSON.stringify(items)}\n\nSuggest up to five recipes. For each recipe, provide:\n- Title\n- Full list of ingredients (must be a subset of the pantry ingredients, do not add anything extra)\n- Step-by-step instructions\n\nReturn your answer as a JSON array of objects, each with 'title', 'ingredients' (array), and 'steps' (array of strings).`;
        const geminiTextRes = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: prompt }] }
              ]
            })
          }
        );
        if (!geminiTextRes.ok) {
          const err = await geminiTextRes.text();
          return withCors(new Response(`Recipe-gen error ${geminiTextRes.status}: ${err}`, { status: 502 }));
        }
        const textData = await geminiTextRes.json();
        const generated = textData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        let recipes = [];
        try {
          recipes = JSON.parse(
            generated.slice(
              generated.indexOf("["),
              generated.lastIndexOf("]") + 1
            )
          );
        } catch (e) {
          recipes = [];
        }
        return withCors(new Response(JSON.stringify(recipes), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      else if (path === "/openai") {
        // Proxy OpenAI chat completion request
        const body = await request.json();
        const openaiRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );
        const text = await openaiRes.text();
        return withCors(new Response(text, {
          status: openaiRes.status,
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
