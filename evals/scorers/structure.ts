// extract the expected counts from characteristics list
// count actual elements

import type { EvalScorer } from "braintrust";
import { GoldenTestCase } from "../buildMessages";
import { AgentOutput } from "./schema";
import { DiagramType } from "../../src/schema";

const TYPE_KEYWORDS: Record<DiagramType, string[]> = {
  rectangle: ["rectangle", "rectangles", "box", "boxes"],
  ellipse: ["ellipse", "ellipses", "circle", "circles"],
  diamond: ["diamond", "diamonds"],
  arrow: ["arrow", "arrows"],
  line: ["line", "lines"],
  text: ["text", "label", "labels"],
};

// match the words in expected
function parseExpectedCounts(expected: string[]): Record<string, number> {
  const count: Record<string, number> = {};
  const joined = expected.join(" ").toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      const re = new RegExp(`(\\d+)\\s+${keyword}\\b`, "g");
      let match: RegExpExecArray | null;
      while ((match = re.exec(joined)) != null) {
        const n = parseInt(match[1]!, 10);
        count[type] = Math.max(count[type] ?? 0, n);
      }
    }
  }
  return count;
}

// match in actual elements
function countByType(elements: unknown[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const el of elements) {
    if (el && typeof el == "object" && "type" in el) {
      const t = el.type as string;
      counts[t] = counts[t] ?? 0 + 1;
    }
  }
  return counts;
}

export const structureScorer: EvalScorer<GoldenTestCase, AgentOutput, GoldenTestCase> = ({
  output,
  expected,
}) => {
  if (!Array.isArray(output.elements) || output.elements.length == 0) {
    return { name: "Structure", score: 0, metadata: { reason: "no elements" } };
  }

  if (!expected) {
    return { name: "Structure", score: 0.5, metadata: { reason: "no expected provided" } };
  }

  const expectedCounts = parseExpectedCounts(expected.expectedCharacteristics);
  const actualCounts = countByType(output.elements);

  // check length of expected
  if (Object.keys(expectedCounts).length == 0) {
    return {
      name: "Structure",
      score: 0.5,
      metadata: { reason: "no countable expectations", actualCounts },
    };
  }

  // totalScore and totalChecks from expectedCounts
  let totalScore = 0;
  let totalChecked = 0;

  for (const [type, expectedN] of Object.entries(expectedCounts)) {
    const actualN = actualCounts[type] ?? 0;
    const diff = Math.abs(expectedN - actualN);
    totalScore += Math.max(0, 1 - diff / expectedN);
    totalChecked += 1;
  }

  return {
    name: "Structure",
    score: totalChecked > 0 ? totalScore / totalChecked : 0,
    metadata: { expectedCounts, actualCounts },
  };
};
