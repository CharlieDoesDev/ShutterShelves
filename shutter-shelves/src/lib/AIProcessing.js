import { processGeminiResults } from "./GeminiProcessing";

/**
 * Handles the completion of AI processing (e.g., Gemini, OpenAI, etc.).
 * This function delegates to the appropriate model-specific processor.
 *
 * @param {Object} params - The processing result params.
 * @returns {{ images: any[], recipes: any[] }}
 */
export function onProcessFinished(params) {
  // For now, only Gemini is supported. In the future, you could switch on params.modelType, etc.
  return processGeminiResults(params);
}
