// for modify test cases, preserved must still exist in agents' output
// catches when agent regenerates whole canvas instead of patching it

// returns null if preservedIds is not given so braintrust skips it

import { EvalScorer } from "braintrust";
import { GoldenTestCase } from "../buildMessages";
import { AgentOutput } from "./schema";

export const preservationScorer: EvalScorer<GoldenTestCase, AgentOutput, GoldenTestCase> = ({
  output,
  expected,
}) => {
  const preservedIds = expected?.preservedIds;
  if (!preservedIds || preservedIds.length == 0) {
    return null;
  }

  const outputIds = new Set(
    output.elements
      .filter((el): el is { id: string } => !!el && typeof el === "object" && "id" in el)
      .map((el) => el.id),
  );

  let kept = 0;
  const missing: string[] = [];
  for (const id of preservedIds) {
    if (outputIds.has(id)) kept += 1;
    else missing.push(id);
  }

  return {
    name: "Preservation",
    score: kept / preservedIds.length,
    metadata: { kept, missing, total: preservedIds.length },
  };
};
