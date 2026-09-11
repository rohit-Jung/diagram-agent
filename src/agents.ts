import { AIChatAgent } from "@cloudflare/ai-chat";
import { getModel } from "./model";
import { convertToModelMessages, createUIMessageStreamResponse, toUIMessageStream } from "ai";

import { streamAgent } from "./agent-core";
import { SYSTEM_PROMPT } from "./prompts";

interface Env extends Cloudflare.Env {
  OPENROUTER_API_KEY: string;
}

export class DesignAgent extends AIChatAgent<Env> {
  async onChatMessage(): Promise<Response | undefined> {
    const model = getModel({
      apiKey: this.env.OPENROUTER_API_KEY,
    });

    const result = streamAgent({
      model,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      maxSteps: 5,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(result),
    });
  }
}
