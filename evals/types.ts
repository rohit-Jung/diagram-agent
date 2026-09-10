export type Difficulty = "simple" | "medium" | "hard" | "edge";
export type Cateogry = "layout" | "content" | "structure" | "edge-case";

export interface TestCase {
  id: string;
  input: string;
  expectedCharacteristics: string[]; // a good response looks like
  difficulty: Difficulty;
  category: Cateogry; // spot failure in patterns
}

export interface EvalResult {
  testCaseId: string;
  input: string;
  response: string;
  elements: unknown[];
  durationMs: number;
  error?: string;
}

export interface ScoredResult extends EvalResult {
  score: 1 | 2 | 3 | 4 | 5; // according to scoring rubric
  notes?: string;
}
