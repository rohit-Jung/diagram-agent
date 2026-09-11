import { config } from "dotenv";
import { buildMessages, GoldenTestCase } from "./buildMessages";
import { runAgent } from "../src/agent-core";
import { getModel } from "../src/model";
import { readFileSync } from "fs";
import { join } from "path";
import { Eval } from "braintrust";
import { AgentOutput, schemaScorer } from "./scorers/schema";
import { structureScorer } from "./scorers/structure";
import { labelScorer } from "./scorers/labelKeyword";
import { preservationScorer } from "./scorers/preservation";

config({ path: ".dev.vars" });

const model = getModel({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const testCases: GoldenTestCase[] = JSON.parse(
  readFileSync(join("evals", "datasets", "golden.json"), "utf-8"),
);

Eval<GoldenTestCase, AgentOutput, GoldenTestCase>("Diagram Agent", {
  data: () =>
    testCases.map((tc) => ({
      // we pass in both  as tc scorers are configured to take what they care about
      input: tc,
      expected: tc,
      metadata: {
        id: tc.id,
        difficulty: tc.difficulty,
        category: tc.category,
      },
    })),

  task: async (testCase) => {
    const result = await runAgent({
      model,
      messages: buildMessages(testCase),
    });

    return { text: result.text, elements: result.elements };
  },

  scores: [schemaScorer, structureScorer, labelScorer, preservationScorer],
});
