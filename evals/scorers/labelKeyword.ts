// intentionally dumb for now as it doesn't know things like
// client and user agent are related and things like that
// RAG would be integrated later for agent's better understanding

import { EvalScorer } from "braintrust";
import { GoldenTestCase } from "../buildMessages";
import { AgentOutput } from "./schema";

export const labelScorer: EvalScorer<GoldenTestCase, AgentOutput, GoldenTestCase> = ({
  output,
  expected,
}) => {
  const keywords = expected?.expectedKeyword;
  if (!keywords || keywords.length == 0) {
    return null;
  }

  const haystack = [
    output.text,
    ...output.elements
      .flatMap((el) => {
        if (!el || typeof el !== "object") return [];
        const e = el as Record<string, unknown>;
        return [e.text, e.label].filter((v) => typeof v === "string") as string[];
      })
      .join(" ")
      .toLowerCase(),
  ];

  const matched = keywords.filter((kw) => haystack.includes(kw.toLowerCase()));
  return {
    name: "LabelKeywords",
    score: matched.length / keywords.length,
    metadata: {
      matched,
      missing: keywords.filter((kw) => !matched.includes(kw)),
    },
  };
};
