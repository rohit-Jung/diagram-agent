import { ModelMessage } from "ai";
import { Cateogry, Difficulty } from "./types";

export interface SeedData {
  userPrompt: string;
  assistanceConfirmation: string;
  elements: unknown[];
}

export interface GoldenTestCase {
  id: string;
  input: string;
  seed?: SeedData;
  expectedCharacteristics: string[];
  expectedKeyword?: string[];
  preservedIds?: string[];
  difficulty: Difficulty;
  category: Cateogry;
}

export function buildMessages(tc: GoldenTestCase): ModelMessage[] {
  if (!tc.seed) {
    return [{ role: "user", content: tc.input }];
  }

  const callId = `${tc.id}_seed`;
  return [
    {
      role: "user",
      content: tc.seed.userPrompt,
    },
    {
      role: "assistant",
      content: [
        {
          type: "tool-call",
          toolCallId: callId,
          toolName: "generateDiagram",
          input: { elements: tc.seed.elements },
        },
      ],
    },
    {
      role: "assistant",
      content: [
        {
          type: "tool-result",
          toolCallId: callId,
          toolName: "generateDiagram",
          output: { type: "json", value: { elements: tc.seed.elements as never } },
        },
      ],
    },
    { role: "assistant", content: tc.seed.assistanceConfirmation },
    { role: "user", content: tc.input },
  ];
}
