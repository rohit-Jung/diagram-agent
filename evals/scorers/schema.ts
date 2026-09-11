import type { EvalScorer } from "braintrust";
import { GoldenTestCase } from "../buildMessages";
import { Diagram } from "../../src/schema";

const REQUIRED_FIELDS = ["id", "type", "x", "y", "width", "height"] as const;
const VALID_TYPES = Object.values(Diagram);

export interface AgentOutput {
  text: string;
  elements: unknown[];
}

export const schemaScorer: EvalScorer<GoldenTestCase, AgentOutput, GoldenTestCase> = ({
  output,
}) => {
  if (!Array.isArray(output.elements) || output.elements.length == 0) {
    return { name: "Schema", score: 0, metadata: { reason: "no elements found" } };
  }

  for (const element of output.elements) {
    if (!element || typeof element !== "object") {
      return { name: "Schema", score: 0, metadata: { reason: "element is not an object" } };
    }

    const el = element as Record<string, unknown>;
    for (const field in REQUIRED_FIELDS) {
      if (!(field in el)) {
        return { name: "Schema", score: 0, metadata: { reason: `${el.id} missing ${field}` } };
      }
    }

    if (typeof el.type !== "string" || !VALID_TYPES.includes(el.type as any)) {
      return { name: "Schema", score: 0, metadata: { reason: `${el.id} invalid type ${el.type}` } };
    }
  }

  return { name: "Schema", score: 1, metadata: {} };
};
