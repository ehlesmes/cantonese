import { describe, test, expect } from "vitest";
import { findUnregisteredWords } from "./lib/register-utils";
import type { SemanticUnit } from "../src/types";

describe("Missing Word Register Spec", () => {
  const dictionary = [
    { char: "去", jyutping: "heoi3", type: "verb" },
    { char: "你好", jyutping: "nei5hou2", type: "expression" },
    { char: "買", jyutping: "maai5", type: "verb" },
  ];

  test("correctly identifies unregistered words", () => {
    const chapterUnits: SemanticUnit[] = [
      {
        raw: "你好[nei5hou2|hello]",
        characters: "你好",
        jyutping: "nei5hou2",
        translation: "hello",
        index: 0,
      },
      {
        raw: "唔該[m4goi1|excuse me]",
        characters: "唔該",
        jyutping: "m4goi1",
        translation: "excuse me",
        index: 20,
      },
    ];

    const results = findUnregisteredWords(chapterUnits, dictionary);

    // "你好" is registered.
    // "唔該" is unregistered.
    expect(results).toHaveLength(1);
    expect(results[0]?.char).toBe("唔該");
    expect(results[0]?.definition).toBe("excuse me");
    expect(results[0]?.type).toBe("TODO_TYPE"); // Default
  });

  test("handles A-not-A question format resolution", () => {
    const chapterUnits: SemanticUnit[] = [
      {
        raw: "去唔去[heoi3 m4 heoi3|to go or not]",
        characters: "去唔去",
        jyutping: "heoi3 m4 heoi3",
        translation: "to go or not",
        index: 0,
      },
      {
        raw: "食唔食[sik6 m4 sik6|to eat or not]",
        characters: "食唔食",
        jyutping: "sik6 m4 sik6",
        translation: "to eat or not",
        index: 20,
      },
    ];

    const results = findUnregisteredWords(chapterUnits, dictionary);

    // "去唔去" has base "去" which is registered -> ignored (not registered as missing).
    // "食唔食" has base "食" which is NOT registered -> marked as unregistered.
    expect(results).toHaveLength(1);
    expect(results[0]?.char).toBe("食唔食");
  });

  test("guesses grammatical type for verbs starting with 'to'", () => {
    const chapterUnits: SemanticUnit[] = [
      {
        raw: "行[haang4|to walk]",
        characters: "行",
        jyutping: "haang4",
        translation: "to walk",
        index: 0,
      },
    ];

    const results = findUnregisteredWords(chapterUnits, dictionary);

    expect(results).toHaveLength(1);
    expect(results[0]?.char).toBe("行");
    expect(results[0]?.type).toBe("verb"); // Guessed
  });

  test("copies grammatical type from existing different-pronunciation dictionary entry", () => {
    const chapterUnits: SemanticUnit[] = [
      {
        raw: "去[keoi5|alternative pronunciation]",
        characters: "去",
        jyutping: "keoi5",
        translation: "alternative pronunciation",
        index: 0,
      },
    ];

    const results = findUnregisteredWords(chapterUnits, dictionary);

    // "去" with "keoi5" is unregistered, but "去" exists as a "verb" in the dictionary.
    expect(results).toHaveLength(1);
    expect(results[0]?.char).toBe("去");
    expect(results[0]?.type).toBe("verb"); // Copied from existing entry
  });
});
