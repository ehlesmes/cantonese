import { describe, test, expect } from "vitest";
import {
  validateJyutping,
  validateChapterContent,
  checkChronologicalLimits,
} from "./format-utils.js";

describe("Format Utils - validateJyutping", () => {
  test("accepts valid jyutping", () => {
    expect(validateJyutping("m4goi1")).toBeNull();
    expect(validateJyutping("leng3zai2")).toBeNull();
    expect(validateJyutping("sik6 m4 sik6")).toBeNull();
    expect(validateJyutping("ng5")).toBeNull();
  });

  test("rejects invalid jyutping", () => {
    expect(validateJyutping("m4goi")).toContain("Invalid Jyutping format");
    expect(validateJyutping("m4goi7")).toContain("Invalid Jyutping format");
    expect(validateJyutping("m4 goi1 ")).toContain("Invalid Jyutping format");
  });
});

describe("Format Utils - validateChapterContent", () => {
  test("validates frontmatter", () => {
    const chapterData = {
      frontmatter: {
        id: "01-intro",
        title: "Intro",
        description: "Intro chapter",
      },
      blocks: [],
    };

    // Valid
    expect(
      validateChapterContent(chapterData, "01-intro", {
        id: "01-intro",
        title: "Intro",
      }),
    ).toEqual([]);

    // Invalid mismatch id
    expect(
      validateChapterContent(chapterData, "02-food", undefined)[0]?.message,
    ).toContain("does not match the filename slug");
  });

  test("validates prose blocks for unannotated chinese", () => {
    const chapterData = {
      frontmatter: { id: "01", title: "T", description: "D" },
      blocks: [
        {
          type: "prose",
          content:
            "This is valid `唔該[m4goi1|thanks]`.\nThis is invalid 早晨.",
          startLine: 5,
        },
      ],
    };

    const errors = validateChapterContent(chapterData, "01");
    expect(errors.length).toBe(1);
    expect(errors[0]?.message).toContain(
      'Found unannotated Chinese character "早"',
    );
  });

  test("validates dialog formatting", () => {
    const chapterData = {
      frontmatter: { id: "01", title: "T", description: "D" },
      blocks: [
        {
          type: "dialog",
          content:
            "A: 唔該[m4goi1|thanks]\n=== \nB: 早晨[zou2san4|good morning]",
          startLine: 10,
        },
      ],
    };

    // Odd number of lines in dialog
    const errors = validateChapterContent(chapterData, "01");
    expect(errors[0]?.message).toContain("even number of lines");
  });

  test("validates prose edge cases", () => {
    const chapterData = {
      frontmatter: { id: "01", title: "T", description: "D" },
      blocks: [
        {
          type: "prose",
          content: "`` `唔該[m4goi|bad-jp]`",
          startLine: 1,
        },
      ],
    };
    const errors = validateChapterContent(chapterData, "01");
    expect(
      errors.some((e) => e.message.includes("double/adjacent backticks")),
    ).toBe(true);
    expect(errors.some((e) => e.message.includes("Invalid Jyutping"))).toBe(
      true,
    );
  });

  test("validates cantonese edge cases", () => {
    const chapterData = {
      frontmatter: { id: "01", title: "T", description: "D" },
      blocks: [
        {
          type: "cantonese",
          content: "唔該[m4goi|bad-jp]\n===\n早",
          startLine: 1,
        },
      ],
    };
    const errors = validateChapterContent(chapterData, "01");
    expect(errors.some((e) => e.message.includes("Invalid Jyutping"))).toBe(
      true,
    );
    expect(errors.some((e) => e.message.includes("illegal Chinese"))).toBe(
      true,
    );
  });

  test("validates dialog edge cases", () => {
    const chapterData = {
      frontmatter: { id: "01", title: "T", description: "D" },
      blocks: [
        {
          type: "dialog",
          content: "A: 唔該[m4goi|bad-jp]\n=== 早\nBadSpeakerTurn\n=== ",
          startLine: 1,
        },
      ],
    };
    const errors = validateChapterContent(chapterData, "01");
    expect(errors.some((e) => e.message.includes("Invalid Jyutping"))).toBe(
      true,
    );
    expect(errors.some((e) => e.message.includes("illegal Chinese"))).toBe(
      true,
    );
    expect(
      errors.some((e) =>
        e.message.includes("must start with a letter and colon"),
      ),
    ).toBe(true);
  });

  test("validates exercise edge cases", () => {
    const chapterData = {
      frontmatter: { id: "01", title: "T", description: "D" },
      blocks: [
        {
          type: "exercise",
          content: "invalid: yaml: [",
          startLine: 1,
        },
        {
          type: "exercise",
          content: "question: A\nanswer: B\nexplanation: C\nextra: D",
          startLine: 10,
        },
        {
          type: "exercise",
          content: "question: 早\nanswer: B\nexplanation: C",
          startLine: 20,
        },
      ],
    };
    const errors = validateChapterContent(chapterData, "01");
    expect(errors.some((e) => e.message.includes("unrecognized key"))).toBe(
      true,
    );
    expect(
      errors.some((e) => e.message.includes("unannotated Chinese character")),
    ).toBe(true);
  });
});

describe("Format Utils - checkChronologicalLimits", () => {
  test("reports when chapter introduces more than 25 new words", () => {
    const curriculumChapters = [{ id: "01", file: "01.md" }];

    let content = "";
    for (let i = 0; i < 26; i++) {
      content += `\`字${i}[zi6|word]\` `;
    }

    const chaptersDataMap = {
      "01.md": {
        blocks: [{ type: "prose", content }],
      },
    };

    const result = checkChronologicalLimits(
      curriculumChapters,
      chaptersDataMap,
    );
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]?.message).toContain(
      "introduces 26 new vocabulary words, exceeding the limit of 25",
    );
  });

  test("handles missing exercise yaml gracefully", () => {
    const curriculumChapters = [{ id: "01", file: "01.md" }];
    const chaptersDataMap = {
      "01.md": {
        blocks: [{ type: "exercise", content: "invalid: [" }],
      },
    };
    const result = checkChronologicalLimits(
      curriculumChapters,
      chaptersDataMap,
    );
    expect(result.errors.length).toBe(0);
  });
});
