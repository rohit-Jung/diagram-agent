import { generateText, LanguageModel, ModelMessage, stepCountIs, streamText } from "ai";
import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./prompts";

interface AgentArgs {
  model: LanguageModel;
  messages: ModelMessage[];
  system?: string;
  maxSteps?: number;
}

// streaming variant of agent: used by worker and live chat
export function streamAgent({ model, messages, system = SYSTEM_PROMPT, maxSteps = 5 }: AgentArgs) {
  return streamText({ model, messages, system, tools, stopWhen: stepCountIs(maxSteps) });
}

// non streaming version: used by evals
export async function runAgent({
  model,
  messages,
  system = SYSTEM_PROMPT,
  maxSteps = 5,
}: AgentArgs) {
  const result = await generateText({ model, messages, system, stopWhen: stepCountIs(maxSteps) });
  return { text: result.text, elements: extractElements(result.steps), steps: result.steps };
}

interface StepLike {
  toolResults?: { toolName: string; output: unknown }[];
}

export function extractElements(steps: StepLike[]): unknown[] {
  const elements: unknown[] = [];
  for (const step of steps) {
    for (const result of step.toolResults ?? []) {
      if (result.toolName === "generateDiagram") {
        const output = result.output as { elements?: unknown[] };
        if (Array.isArray(output.elements)) elements.push(...output.elements);
      }
    }
  }

  return elements;
}
