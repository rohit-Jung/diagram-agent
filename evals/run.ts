import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, stepCountIs } from "ai";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { SYSTEM_PROMPT } from "../src/prompts";
import { EvalResult, TestCase } from "./types";
import { tools } from "../src/tools";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadDevVars(): Record<string, string> {
  try {
    const vars: Record<string, string> = {};
    const contents = readFileSync(join(ROOT, ".dev.vars"), "utf-8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const [key, ...rest] = trimmed.split("=");
      if (key) vars[key.trim()] = rest.join("=").trim();
    }

    return vars;
  } catch {
    console.log("error reading dev vars");
    return {};
  }
}

const env = { ...loadDevVars(), ...process.env };
const apiKey = env?.OPENROUTER_API_KEY;
if (!env || !apiKey) {
  console.log("Api Key is not set in .dev.vars");
  process.exit(1);
}

const openrouter = createOpenRouter({ apiKey });
const model = openrouter("deepseek/deepseek-v4-flash");

async function runTestCase(testCase: TestCase): Promise<EvalResult> {
  const start = Date.now();

  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: testCase.input,
      tools,
      stopWhen: stepCountIs(5),
    });

    const elements: unknown[] = [];
    for (const step of result.steps) {
      for (const toolResult of step.toolResults ?? []) {
        if (toolResult.toolName == "generateDiagram") {
          const output = toolResult.output as { elements?: unknown[] };
          if (Array.isArray(output.elements)) {
            elements.push(...output.elements);
          }
        }
      }
    }

    return {
      durationMs: Date.now() - start,
      elements,
      input: testCase.input,
      response: result.text,
      testCaseId: testCase.id,
    };
  } catch (error) {
    return {
      durationMs: Date.now() - start,
      elements: [],
      input: testCase.input,
      response: "",
      testCaseId: testCase.id,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const datasetPath = join(ROOT, "evals/datasets/golden.json");
  const testCases: TestCase[] = JSON.parse(readFileSync(datasetPath, "utf-8"));

  console.log(`Running ${testCases.length} testcases...\n`);

  const results: EvalResult[] = [];
  for (const testCase of testCases) {
    process.stdout.write(`[${testCase.id}]: ${testCase.difficulty.padEnd(6)}`);
    const testCaseResult = await runTestCase(testCase);
    results.push(testCaseResult);

    if (testCaseResult.error) {
      console.log(`[ERROR]: ${testCaseResult.error}\n`);
    } else {
      console.log(
        `[SUCCESS]: ${testCaseResult.elements.length} elements, ${testCaseResult.durationMs}ms\n`,
      );
    }
  }

  // write the timestamped result for manual scoring
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsDir = join(ROOT, "evals/results");
  mkdirSync(resultsDir, { recursive: true });
  const testFile = join(resultsDir, `${timestamp}.json`);
  writeFileSync(testFile, JSON.stringify(results, null, 2));

  const avgDuration = Math.round(
    results.reduce((acc, curr) => curr.durationMs + acc, 0) / results.length,
  );

  console.log(`Results written to ${testFile}\n`);
  console.log(`Next: open the file, review each result, and add score (1-5) and notes.\n`);

  console.log("\n----Summary----\n");
  console.log(`Total: ${results.length}\n`);
  console.log(`Errors: ${results.filter((r) => r.error).length}\n`);
  console.log(
    `Empty results (no elements): ${results.filter((r) => !r.error && r.elements.length === 0).length}\n`,
  );

  console.log(`Avg duration: ${avgDuration}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
