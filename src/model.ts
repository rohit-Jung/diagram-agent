import { createOpenRouter } from "@openrouter/ai-sdk-provider";

interface GetModel {
  apiKey: string | undefined;
  modelName?: string;
}

// const defaultModel = "gpt-5.4-mini";
const defaultModel = "deepseek/deepseek-v4-flash"

function getModel({ modelName = defaultModel, apiKey }: GetModel) {
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  const openrouter = createOpenRouter({ apiKey });
  return openrouter(modelName);
}

export { getModel };
