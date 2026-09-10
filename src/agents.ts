import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./prompts";

interface Env extends Cloudflare.Env {
  OPENROUTER_API_KEY: string;
}

export class DesignAgent extends AIChatAgent<Env> {
  async onChatMessage(): Promise<Response | undefined> {
    const openrouter = createOpenRouter({
      apiKey: this.env.OPENROUTER_API_KEY,
    });

    const model = openrouter("deepseek/deepseek-v4-flash");
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      tools,
      stopWhen: stepCountIs(5),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(result),
    });
  }
}
