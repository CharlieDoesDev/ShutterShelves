// src/AI.js

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_KEY;

export default class AI {
  constructor(options = {}) {
    this.model = options.model || "gpt-4";
    this.apiKey = options.apiKey || OPENAI_API_KEY;
  }

  async command(prompt, systemPrompt = null) {
    const messages = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}
