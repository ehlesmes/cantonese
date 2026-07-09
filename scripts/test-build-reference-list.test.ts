import { describe, test, expect } from "vitest";
import { parseLexicon } from "./lib/lexicon-utils";

describe("Reference List Builder Lexicon Parser Spec", () => {
  test("correctly parses raw Cifu TSV text", () => {
    // Columns:
    // 0: Word (char)
    // 1: Jyutping
    // 5: Spoken Adult PM (frequency_pm)
    // 12: English translation (translation)
    const tsvData = [
      "你好\tnei5 hou2\t_\t_\t_\t25.5\t_\t_\t_\t_\t_\t_\thello",
      "唔該\tm4 goi1\t_\t_\t_\t80.2\t_\t_\t_\t_\t_\t_\texcuse me",
      "abc\ta b c\t_\t_\t_\t99.9\t_\t_\t_\t_\t_\t_\tenglish only", // Non-Chinese char (should be skipped)
      "你好\tnei5 hou2 variant\t_\t_\t_\t50.5\t_\t_\t_\t_\t_\t_\thello 2", // Duplicate char (should be deduped)
      "\t\t_\t_\t_\t_\t_\t_\t_\t_\t_\t_\t", // Empty
    ].join("\n");

    const results = parseLexicon(tsvData);

    // "唔該" has frequency 80.2 (rank 1)
    // "你好" has frequency 50.5 (was first seen on line 1, but sorted by max frequency variant? Wait, seenChars skips subsequent entries).
    // Let's verify how seenChars works:
    // Entries:
    // 1. "你好" (25.5)
    // 2. "唔該" (80.2)
    // 3. "你好" (50.5)
    // Sorted entries by frequency:
    // 1. "唔該" (80.2)
    // 2. "你好" (50.5)
    // 3. "你好" (25.5)
    // Deduping loops through sorted entries:
    // 1. "唔該" (80.2) -> unique, rank 1
    // 2. "你好" (50.5) -> unique, rank 2
    // 3. "你好" (25.5) -> already seen "你好", skipped!
    // So unique list should contain "唔該" at rank 1, "你好" at rank 2.
    expect(results).toHaveLength(2);

    expect(results[0]?.char).toBe("唔該");
    expect(results[0]?.rank).toBe(1);
    expect(results[0]?.frequency_pm).toBe(80.2);

    expect(results[1]?.char).toBe("你好");
    expect(results[1]?.rank).toBe(2);
    expect(results[1]?.frequency_pm).toBe(50.5);
  });

  test("handles empty inputs gracefully", () => {
    expect(parseLexicon("")).toEqual([]);
  });
});
