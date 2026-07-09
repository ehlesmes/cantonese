import { describe, test, expect } from "vitest";
import { evaluateCoverage } from "./lib/coverage-utils";
import type { RefWord } from "./lib/coverage-utils";

describe("Coverage Analyzer Spec", () => {
  const refWords: RefWord[] = [
    { rank: 1, char: "你好", jyutping: "nei5hou2", translation: "hello" },
    { rank: 50, char: "啊", jyutping: "aa1", translation: "ah" }, // Variant is "呀"
    { rank: 150, char: "唔該", jyutping: "m4goi1", translation: "excuse me" },
    { rank: 600, char: "香港", jyutping: "hoeng1gong2", translation: "Hong Kong" },
  ];

  test("calculates coverage and bracket breakdowns correctly", () => {
    // "你好" is taught
    // "唔該" is taught
    // "啊" is covered via variant "呀"
    // "香港" is missing
    const taughtChars = new Set(["你好", "呀", "唔該"]);

    const results = evaluateCoverage(refWords, taughtChars);

    expect(results.totalCovered).toBe(3);
    expect(results.refCount).toBe(4);

    // Verify bracket counts
    const top100 = results.brackets.find((b) => b.name === "Top 100");
    const top100to300 = results.brackets.find((b) => b.name === "Top 100–300");
    const top500to1000 = results.brackets.find((b) => b.name === "Top 500–1000");

    expect(top100?.covered).toBe(2); // "你好" (1) and "啊" (50)
    expect(top100to300?.covered).toBe(1); // "唔該" (150)
    expect(top500to1000?.covered).toBe(0); // "香港" (600) is missing

    // Verify missing words list
    expect(results.missingWords).toHaveLength(1);
    expect(results.missingWords[0]?.char).toBe("香港");
  });

  test("handles empty lists gracefully", () => {
    const results = evaluateCoverage([], new Set());
    expect(results.totalCovered).toBe(0);
    expect(results.refCount).toBe(0);
    expect(results.missingWords).toHaveLength(0);
  });
});
