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
        // Bulk: Accept imagesBase64 (array) or imageBase64 (single)
        const body = await request.json();
        let imagesBase64 = body.imagesBase64;
        if (!imagesBase64 && body.imageBase64) imagesBase64 = [body.imageBase64];
        if (!Array.isArray(imagesBase64) || imagesBase64.length === 0) {
          return withCors(new Response("Missing imagesBase64", { status: 400 }));
        }
        // For each image, get a caption
        const captions = [];
        for (const base64 of imagesBase64) {
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
                      { inline_data: { mime_type: "image/jpeg", data: base64 } }
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
          captions.push(caption);
        }
        // Merge all captions into one description
        const mergedCaption = captions.join("\n");
        // Gemini Text API: Extract pantry items from merged caption
        const prompt = `"You are an intelligent culinary assistant tasked with analyzing photos of pantry contents. Carefully identify each visible food item, including spices, canned goods, grains, sauces, snacks, and any other visible ingredients. After accurately listing these items, generate a practical set of at least five recipes that can be made primarily using the identified pantry ingredients. Ensure recipes vary in type (e.g., snacks, meals, desserts) and clearly state any additional ingredients or basic kitchen staples (such as salt, oil, or eggs) that might be required."
Return your answer as a single JSON array of strings, with each string being a specific, quantitative ingredient. Do not include any text or explanation outside the JSON array.

Description(s):\n"${mergedCaption}"`;
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
        // Recommend recipes from item list using Gemini (completion, not JSON parsing)
        const { items } = await request.json();
        if (!Array.isArray(items)) {
          return withCors(new Response("Missing items array", { status: 400 }));
        }
        // Use Gemini to generate a natural language completion for recipes
        const prompt = `Given ONLY these pantry ingredients (as a JSON array):\n${JSON.stringify(items)}\n\nSuggest up to five recipes. For each recipe, provide:\n- Title\n- Full list of ingredients (must be a subset of the pantry ingredients, do not add anything extra)\n- Step-by-step instructions`;
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
        const completion = textData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Return the completion as a string (not parsed JSON)
        return withCors(new Response(JSON.stringify({ completion }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      else if (path === "/openai") {
        // Proxy Gemini chat completion request instead of OpenAI
        const body = await request.json();
        // Expecting: { model, messages, max_tokens }
        const userMessage = body.messages?.[0]?.content || "";
        const geminiRes = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: userMessage }] }
              ]
            })
          }
        );
        const geminiData = await geminiRes.json();
        // Format Gemini response to mimic OpenAI's chat completion structure
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const fakeOpenAIResponse = {
          id: "gemini-chat-fake",
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "gemini-2.0-flash",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: text },
              finish_reason: "stop"
            }
          ]
        };
        return withCors(new Response(JSON.stringify(fakeOpenAIResponse), {
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
