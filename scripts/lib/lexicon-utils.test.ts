import { describe, expect, test } from "vitest";
import { parseLexicon } from "./lexicon-utils.js";

describe("lexicon-utils", () => {
  test("should handle missing translations and NaN spokenAdultPm gracefully", () => {
    // 13 columns needed. 5th column (index 5) is spokenAdultPm. 12th column (index 12) is translation.

    // Test 1: spokenAdultPm is NaN -> should be ignored.
    const dictStr1 = [
      "字1",
      "zi6",
      "freq",
      "rank",
      "w_pm",
      "NaN",
      "other",
      "other",
      "other",
      "other",
      "other",
      "other",
      "trans",
    ].join("\t");
    expect(parseLexicon(dictStr1)).toHaveLength(0);

    // Test 2: translation is missing (empty string in 13th column)
    const dictStr2 = [
      "字2",
      "zi6",
      "freq",
      "rank",
      "w_pm",
      "0.5",
      "other",
      "other",
      "other",
      "other",
      "other",
      "other",
      "",
      "something",
    ].join("\t");
    const dict2 = parseLexicon(dictStr2);
    expect(dict2).toHaveLength(1);
    expect(dict2[0]!.translation).toBe("");
  });
});
