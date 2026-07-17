import { describe, test, expect } from "vitest";
import {
  validateRegisterEntry,
  sortDictionary,
  extractChapterUnits,
  verifyChapterContent,
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

  test("validateRegisterEntry returns valid entry with alt_jyutping", () => {
    const batchKeys = new Set<string>();
    const res = validateRegisterEntry(
      {
        char: "錢",
        jyutping: "cin4",
        alt_jyutping: ["cin2"],
        definition: "money",
        type: "noun",
      },
      dictionary,
      batchKeys,
    );
    expect(res.validEntry).toEqual({
      char: "錢",
      jyutping: "cin4",
      alt_jyutping: ["cin2"],
      definition: "money",
      type: "noun",
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

describe("verifyChapterContent Utility", () => {
  const dictionary = [
    { char: "我", jyutping: "ngo5", definition: "I / me", type: "pronoun" },
    {
      char: "係",
      jyutping: "hai6",
      definition: "to be (am/is/are)",
      type: "verb",
    },
    {
      char: "人",
      jyutping: "jan4",
      definition: "person / human / people",
      type: "noun",
    },
    { char: "去", jyutping: "heoi3", definition: "to go", type: "verb" },
  ];

  test("returns empty lists for chapter without units", () => {
    const chapterData = { blocks: [] };
    const res = verifyChapterContent(chapterData, dictionary);
    expect(res).toEqual({ errors: [], warnings: [], passedCount: 0 });
  });

  test("passes for exact matches", () => {
    const chapterData = {
      blocks: [
        {
          type: "prose",
          content: "`我[ngo5|I]` `係[hai6|am]` `人[jan4|human]`",
          startLine: 1,
        },
      ],
    };
    const res = verifyChapterContent(chapterData, dictionary);
    expect(res.errors.length).toBe(0);
    expect(res.warnings.length).toBe(0);
    expect(res.passedCount).toBe(3);
  });

  test("passes for alt_jyutping matches (Tone Sandhi)", () => {
    const customDictionary = [
      ...dictionary,
      {
        char: "錢",
        jyutping: "cin4",
        alt_jyutping: ["cin2"],
        definition: "money",
        type: "noun",
      },
    ];

    const chapterData = {
      blocks: [
        {
          type: "prose",
          content: "`錢[cin2|money]` `錢[cin4|money]`",
          startLine: 1,
        },
      ],
    };
    const res = verifyChapterContent(chapterData, customDictionary);
    expect(res.errors.length).toBe(0);
    expect(res.warnings.length).toBe(0);
    expect(res.passedCount).toBe(2);
  });

  test("reports critical errors for unregistered terms", () => {
    const chapterData = {
      blocks: [{ type: "prose", content: "`鬼[gwai2|ghost]`", startLine: 1 }],
    };
    const res = verifyChapterContent(chapterData, dictionary);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]?.term).toBe("鬼 (gwai2)");
    expect(res.errors[0]?.message).toContain(
      "Term is introduced in chapter but not registered",
    );
  });

  test("handles dynamic A-not-A question pattern resolution", () => {
    // "去唔去" with jyutping "heoi3 m4 heoi3"
    const chapterData1 = {
      blocks: [
        {
          type: "prose",
          content: "`去唔去[heoi3 m4 heoi3|go or not]`",
          startLine: 1,
        },
      ],
    };
    const res1 = verifyChapterContent(chapterData1, dictionary);
    expect(res1.errors.length).toBe(0);
    expect(res1.passedCount).toBe(1);

    // "食唔食" (base verb "食" not in dict)
    const chapterData2 = {
      blocks: [
        {
          type: "prose",
          content: "`食唔食[sik6 m4 sik6|eat or not]`",
          startLine: 1,
        },
      ],
    };
    const res2 = verifyChapterContent(chapterData2, dictionary);
    expect(res2.errors.length).toBe(1);
    expect(res2.errors[0]?.term).toBe("食唔食 (sik6 m4 sik6)");
  });

  test("checks semantics and flags translation divergence warning", () => {
    // Divergence: definition is "to go", translation is "completely different word"
    const chapterData = {
      blocks: [{ type: "prose", content: "`去[heoi3|apple]`", startLine: 1 }],
    };
    const res = verifyChapterContent(chapterData, dictionary);
    expect(res.errors.length).toBe(0);
    expect(res.warnings.length).toBe(1);
    expect(res.warnings[0]?.term).toBe("去 (heoi3)");
    expect(res.warnings[0]?.message).toContain("Translation divergence");
  });
});
