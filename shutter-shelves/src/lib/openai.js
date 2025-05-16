import { OpenAI } from 'openai';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_AOAI_KEY,
  azure: {
    resourceName: import.meta.env.VITE_AOAI_ENDPOINT
      .replace(/^https?:\/\//,'').replace(/\/$/,''),
    deploymentName: import.meta.env.VITE_AOAI_DEPLOYMENT,
    apiVersion: import.meta.env.VITE_AOAI_API_VERSION,
  },
});
