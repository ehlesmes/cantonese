import { describe, test, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";

// Helper function to strip ANSI escape codes
const stripAnsi = (str: string) => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
};

describe("Cantonese Lexicon Lookup CLI E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");

  const runLookup = (args: string) => {
    const rawOutput = execSync(`npx tsx scripts/lookup.ts ${args}`, {
      cwd: projectRoot,
      encoding: "utf8",
    });
    return stripAnsi(rawOutput);
  };

  test("Display usage instructions when no arguments are provided", () => {
    const output = runLookup("");
    expect(output).toContain("Cantonese Lexicon Lookup Utility");
    expect(output).toContain("Usage (Single or Space-Separated Batch):");
    expect(output).toContain("npm run vocab:lookup -- <query1>");
  });

  test("Lookup by exact Traditional Chinese characters", () => {
    const output = runLookup("唔該");
    expect(output).toContain('Query: "唔該"');
    expect(output).toContain("唔該 (m4goi1)");
    expect(output).toContain("excuse me / please / thank you");
    expect(output).toContain("Expression");
  });

  test("Lookup with zero results displays custom suggestions", () => {
    const output = runLookup("nonexistentword");
    expect(output).toContain('Query: "nonexistentword"');
    expect(output).toContain("No matching entries found in the dictionary.");
  });

  test("Lookup multiple space-separated query strings (batch mode)", () => {
    const output = runLookup("唔該 八達通 檸茶");
    expect(output).toContain("Querying database for 3 terms...");
    expect(output).toContain('Query: "唔該"');
    expect(output).toContain('Query: "八達通"');
    expect(output).toContain('Query: "檸茶"');
    expect(output).toContain("唔該 (m4goi1)");
    expect(output).toContain("八達通 (baat3daat6tung1)");
    expect(output).toContain("檸茶 (leng4caa4)");
  });

  test("Lookup batch queries via JSON array parameter", () => {
    const output = runLookup(`--json '["唔該", "八達通"]'`);
    expect(output).toContain("Querying database for 2 terms...");
    expect(output).toContain('Query: "唔該"');
    expect(output).toContain('Query: "八達通"');
    expect(output).toContain("唔該 (m4goi1)");
    expect(output).toContain("八達通 (baat3daat6tung1)");
  });
});

export {};
