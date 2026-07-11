import { describe, test, expect } from "vitest";
import {
  validateRegisterEntry,
  sortDictionary,
  extractChapterUnits,
} from "./lib/register-utils.js";

describe("Lexicon Registrar Helpers", () => {
  const dictionary = [{ char: "唔該", jyutping: "m4goi1", type: "expression" }];

  test("validateRegisterEntry rejects empty fields", () => {
    const batchKeys = new Set<string>();

    const res1 = validateRegisterEntry({ char: "" }, dictionary, batchKeys);
    expect(res1.error).toContain("Character cannot be empty");

    const res2 = validateRegisterEntry(
      { char: "腸粉", jyutping: "" },
      dictionary,
      batchKeys,
    );
    expect(res2.error).toContain("Jyutping cannot be empty");

    const res3 = validateRegisterEntry(
      { char: "腸粉", jyutping: "coeng2fan2", definition: "" },
      dictionary,
      batchKeys,
    );
    expect(res3.error).toContain("Definition cannot be empty");
  });

  test("validateRegisterEntry checks jyutping tones and word type", () => {
    const batchKeys = new Set<string>();

    const res1 = validateRegisterEntry(
      {
        char: "腸粉",
        jyutping: "coeng2fan",
        definition: "rolls",
        type: "noun",
      },
      dictionary,
      batchKeys,
    );
    expect(res1.error).toContain("Invalid Jyutping format");

    const res2 = validateRegisterEntry(
      {
        char: "腸粉",
        jyutping: "coeng2fan2",
        definition: "rolls",
        type: "invalid_type",
      },
      dictionary,
      batchKeys,
    );
    expect(res2.error).toContain("Invalid word type");
  });

  test("validateRegisterEntry checks duplicates", () => {
    const batchKeys = new Set<string>();

    // Duplicate in dictionary
    const res1 = validateRegisterEntry(
      {
        char: "唔該",
        jyutping: "m4goi1",
        definition: "thanks",
        type: "expression",
      },
      dictionary,
      batchKeys,
    );
    expect(res1.error).toContain("already registered in the dictionary");

    // Duplicate in batch
    batchKeys.add("腸粉|coeng2fan2");
    const res2 = validateRegisterEntry(
      {
        char: "腸粉",
        jyutping: "coeng2fan2",
        definition: "rolls",
        type: "noun",
      },
      dictionary,
      batchKeys,
    );
    expect(res2.error).toContain(
      'Duplicate entry for "腸粉" with Jyutping "coeng2fan2" found within the batch itself',
    );
  });

  test("validateRegisterEntry returns valid entry", () => {
    const batchKeys = new Set<string>();
    const res = validateRegisterEntry(
      {
        char: "腸粉",
        jyutping: "coeng2fan2",
        definition: "rolls",
        type: "noun",
        notes: "Yummy",
      },
      dictionary,
      batchKeys,
    );
    expect(res.validEntry).toEqual({
      char: "腸粉",
      jyutping: "coeng2fan2",
      definition: "rolls",
      type: "noun",
      notes: "Yummy",
    });
  });

  test("sortDictionary orders by jyutping, then char", () => {
    const data = [
      { char: "腸粉", jyutping: "coeng2fan2", type: "noun" },
      { char: "唔該", jyutping: "m4goi1", type: "expression" },
      { char: "靚仔", jyutping: "coeng2fan2", type: "noun" },
    ];
    const sorted = sortDictionary(data);
    expect(sorted[0]?.char).toBe("腸粉");
    expect(sorted[1]?.char).toBe("靚仔");
    expect(sorted[2]?.char).toBe("唔該");
  });

  test("extractChapterUnits parses blocks and extracts inline/block units", () => {
    const chapterData = {
      blocks: [
        { type: "prose", content: "This is a unit: `我[ngo5|I]`" },
        { type: "cantonese", content: "係[hai6|am] 人[jan4|human]" },
        {
          type: "exercise",
          content:
            "question: |\n  唔該[m4goi1|thanks]\nanswer: |\n  唔該[m4goi1|thanks]",
        },
        { type: "unknown", content: "ignored" },
      ],
    };
    const units = extractChapterUnits(chapterData);
    expect(units.length).toBe(5);
    expect(units.map((u) => u.characters)).toContain("我");
    expect(units.map((u) => u.characters)).toContain("係");
    expect(units.map((u) => u.characters)).toContain("唔該");
  });
});
