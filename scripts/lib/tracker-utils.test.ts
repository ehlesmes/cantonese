import { describe, test, expect } from "vitest";
import {
  resolvePrimaryJyutping,
  mergeTranslations,
  compileVocabularyMap,
  generateVocabularyMarkdown,
  type ChapterInput,
} from "./tracker-utils.js";
import type { DictionaryEntry } from "./register-utils.js";
import type { RawParsedChapter } from "../../src/types/index.js";

describe("Tracker Utils", () => {
  describe("resolvePrimaryJyutping", () => {
    const dictionary: DictionaryEntry[] = [
      {
        char: "調",
        jyutping: "diu6",
        alt_jyutping: ["tiu4"],
        definition: "melody",
        type: "noun",
      },
    ];

    test("should resolve alt_jyutping to primary jyutping", () => {
      expect(resolvePrimaryJyutping("調", "tiu4", dictionary)).toBe("diu6");
    });

    test("should keep original if not found", () => {
      expect(resolvePrimaryJyutping("爸", "baa1", dictionary)).toBe("baa1");
    });
  });

  describe("mergeTranslations", () => {
    test("should merge unique translation nuances", () => {
      expect(mergeTranslations("father / dad", "papa / dad")).toBe(
        "father / dad / papa",
      );
    });

    test("should handle single translations", () => {
      expect(mergeTranslations("father", "dad")).toBe("father / dad");
    });

    test("should ignore duplicates", () => {
      expect(mergeTranslations("father", "father")).toBe("father");
    });

    test("should handle empty or punctuation-only strings", () => {
      expect(mergeTranslations("hello", "!")).toBe("hello");
      expect(mergeTranslations("!", "hello")).toBe("! / hello");
    });

    test("should keep the longer string when core meanings are identical", () => {
      expect(mergeTranslations("eat", "to eat")).toBe("to eat");
    });

    test("should keep the existing string if the new string is a substring of it", () => {
      expect(
        mergeTranslations("exceed mobile data limit", "mobile data limit"),
      ).toBe("exceed mobile data limit");
    });

    test("should replace the existing string if it is a substring of the new string", () => {
      expect(
        mergeTranslations("mobile data limit", "exceed mobile data limit"),
      ).toBe("exceed mobile data limit");
    });
  });

  describe("compileVocabularyMap", () => {
    test("should correctly track vocabulary, handle homographs, and chronological first introductions", async () => {
      const dictionary: DictionaryEntry[] = [
        {
          char: "調",
          jyutping: "diu6", // primary
          alt_jyutping: [], // Imagine homograph isn't linked, so it stays separate
          definition: "melody",
          type: "noun",
        },
      ];

      const chapter1: ChapterInput = {
        curriculumId: "test-vocab-one",
        chapterData: {
          frontmatter: { id: "test-vocab-one" },
          blocks: [
            {
              type: "prose",
              content:
                "This is a `爸爸[baa1baa1|father]` test.\nWe also test `調[tiu4|to adjust]`.",
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const chapter2: ChapterInput = {
        curriculumId: "test-vocab-two",
        chapterData: {
          frontmatter: { id: "test-vocab-two" },
          blocks: [
            {
              type: "prose",
              content:
                "We repeat `爸爸[baa1baa1|dad / father]`.\nAnd test homograph `調[diu6|melody]`.",
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const result = await compileVocabularyMap(
        [chapter1, chapter2],
        dictionary,
      );

      // Homographs tiu4 and diu6 should be separate
      expect(result).toHaveLength(3);

      const tiu4 = result.find(
        (item) => item.character === "調" && item.jyutping === "tiu4",
      );
      expect(tiu4).toBeDefined();
      expect(tiu4!.translation).toBe("to adjust");
      expect(tiu4!.firstIntroducedIn).toBe("test-vocab-one");
      expect(tiu4!.occurrences).toBe(1);

      const diu6 = result.find(
        (item) => item.character === "調" && item.jyutping === "diu6",
      );
      expect(diu6).toBeDefined();
      expect(diu6!.translation).toBe("melody");
      expect(diu6!.firstIntroducedIn).toBe("test-vocab-two");
      expect(diu6!.occurrences).toBe(1);

      const baabaa = result.find((item) => item.character === "爸爸");
      expect(baabaa).toBeDefined();
      expect(baabaa!.firstIntroducedIn).toBe("test-vocab-one");
      expect(baabaa!.occurrences).toBe(2);
      expect(baabaa!.translation).toBe("father / dad");
    });

    test("should handle exercise blocks with valid and invalid YAML", async () => {
      const chapter: ChapterInput = {
        curriculumId: "test-exercise",
        chapterData: {
          frontmatter: { id: "test-exercise" },
          blocks: [
            {
              type: "exercise",
              content:
                "question: '`好[hou2|good]`'\nanswer: '`唔錯[m4co3|not bad]`'\nexplanation: '`明白[ming4baak6|understand]`'",
            },
            {
              type: "exercise",
              content: "invalid yaml : { {", // Should be caught by catch block
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const result = await compileVocabularyMap([chapter], []);

      expect(result).toHaveLength(3);
      expect(result.find((r) => r.character === "好")).toBeDefined();
      expect(result.find((r) => r.character === "唔錯")).toBeDefined();
      expect(result.find((r) => r.character === "明白")).toBeDefined();
    });

    test("should handle sorting with same jyutping but different character", async () => {
      const chapter: ChapterInput = {
        curriculumId: "test-sort",
        chapterData: {
          frontmatter: { id: "test-sort" },
          blocks: [
            {
              type: "prose",
              content: "`B[same1|b]` `A[same1|a]`", // Jyutping is same1 for both, should sort by char
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const result = await compileVocabularyMap([chapter], []);

      expect(result).toHaveLength(2);
      expect(result[0]!.character).toBe("A");
      expect(result[1]!.character).toBe("B");
    });

    test("should handle cantonese and dialog blocks", async () => {
      const chapter: ChapterInput = {
        curriculumId: "test-blocks",
        chapterData: {
          frontmatter: { id: "test-blocks" },
          blocks: [
            {
              type: "cantonese",
              content: "我[ngo5|I] 係[hai6|am]",
            },
            {
              type: "dialog",
              content: "A: 你[nei5|you] 好[hou2|good]",
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const result = await compileVocabularyMap([chapter], []);

      expect(result).toHaveLength(4);
      expect(result.find((r) => r.character === "我")).toBeDefined();
      expect(result.find((r) => r.character === "係")).toBeDefined();
      expect(result.find((r) => r.character === "你")).toBeDefined();
      expect(result.find((r) => r.character === "好")).toBeDefined();
    });

    test("should ignore exercise block if YAML parsing throws", async () => {
      const parser = await import("./parser.js");
      const { vi } = await import("vitest");
      const spy = vi.spyOn(parser, "parseYAML").mockImplementationOnce(() => {
        throw new Error("Simulated parse error");
      });

      const chapter: ChapterInput = {
        curriculumId: "test-throw",
        chapterData: {
          frontmatter: { id: "test-throw" },
          blocks: [
            {
              type: "exercise",
              content: "invalid yaml that throws",
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const result = await compileVocabularyMap([chapter], []);
      expect(result).toHaveLength(0);
      spy.mockRestore();
    });

    test("should ignore unknown block types and fallback to curriculumId if frontmatter id is missing", async () => {
      const chapter: ChapterInput = {
        curriculumId: "fallback-id",
        chapterData: {
          frontmatter: null, // Missing frontmatter
          blocks: [
            {
              type: "other", // Unknown block type
              content: "should be ignored",
            },
            {
              type: "prose",
              content: "`我[ngo5|I]`", // Should register under fallback-id
            },
          ],
        } as unknown as RawParsedChapter,
      };

      const result = await compileVocabularyMap([chapter], []);
      expect(result).toHaveLength(1);
      expect(result[0]!.firstIntroducedIn).toBe("fallback-id");
      expect(result[0]!.character).toBe("我");
    });
  });

  describe("generateVocabularyMarkdown", () => {
    test("should render correct markdown table", () => {
      const vocab = [
        {
          character: "爸爸",
          jyutping: "baa1 baa1",
          translation: "father / dad",
          hash: "abc",
          firstIntroducedIn: "test-vocab-one",
          occurrences: 2,
        },
      ];
      const md = generateVocabularyMarkdown(vocab);
      expect(md).toContain(
        "| **爸爸** | `baa1 baa1` | father / dad | `test-vocab-one` | 2 |",
      );
    });
  });
});
