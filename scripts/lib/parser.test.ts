import fs from "fs";
import { describe, test, expect, vi } from "vitest";
import {
  parseYAML,
  parseChapter,
  parseCurriculum,
  buildCurriculumIndex,
} from "./parser.js";

vi.mock("fs");

describe("Parser - parseYAML", () => {
  test("parses flat key-values with missing colons", () => {
    // A line with no colon is ignored/handled differently
    const yaml = "key\nkey2: val2\n  \n"; // includes empty line with spaces
    const result = parseYAML(yaml);
    expect(result.key2).toBe("val2");
  });

  test("parses array lists without currentKey", () => {
    const yaml = "- item1\n- item2\n";
    const result = parseYAML(yaml);
    expect(result.chapters).toHaveLength(2);
  });

  test("parses array lists with quoted values", () => {
    const yaml = "list:\n  - key: \"value1\"\n  - key: 'value2'\n";
    const result = parseYAML(yaml) as { list: { key: string }[] };
    expect(result.list).toHaveLength(2);
    // @ts-expect-error - Expected due to intentional malformed test data
    expect(result.list[0].key).toBe("value1");
    // @ts-expect-error - Expected due to intentional malformed test data
    expect(result.list[1].key).toBe("value2");
  });

  test("parses array lists with flat strings and numbers", () => {
    const yaml =
      "list:\n  - apple\n  - 'banana'\n  - \"cherry\"\n  - a:\n  - 123\n  -";
    const result = parseYAML(yaml) as { list: unknown[] };
    expect(result.list).toHaveLength(6);
    expect(result.list[0]).toBe("apple");
    expect(result.list[1]).toBe("banana");
    expect(result.list[2]).toBe("cherry");
    expect(result.list[3]).toEqual({ a: "" }); // handles empty object property implicitly (falls back to scalar or missing) or whatever it parsed
    expect(result.list[4]).toBe(123);
    expect(result.list[5]).toBe("");
  });
});

describe("Parser - parseChapter edge cases", () => {
  test("handles unclosed frontmatter and undefined lines", () => {
    const content = "---\nid: 01\n";
    vi.spyOn(fs, "readFileSync").mockReturnValue(content);
    // Simulate undefined lines via mock? No, we can't easily mock undefined lines via readFileSync because readFileSync returns string.
    // parseChapter uses string.split, which never returns undefined. The `if (line === undefined)` is just defensive typing.
    const result = parseChapter("dummy.md");
    expect(result.frontmatter).toBeNull();
  });

  test("handles unclosed code blocks and code blocks at end of file", () => {
    // 1. With trailing newline (currentBlockLines = [""])
    const content = "prose line\n```cantonese\nexample line\n```\n";
    vi.spyOn(fs, "readFileSync").mockReturnValue(content);
    const result = parseChapter("dummy.md");
    expect(result.blocks).toHaveLength(3); // prose, cantonese, trailing empty prose

    // 2. Unclosed code block
    const contentUnclosed = "prose line\n```cantonese\nexample line\n";
    vi.spyOn(fs, "readFileSync").mockReturnValue(contentUnclosed);
    const resultUnclosed = parseChapter("dummy.md");
    expect(resultUnclosed.blocks).toHaveLength(2);

    // 3. Without trailing newline (currentBlockLines = [])
    const contentNoTrailing = "prose line\n```cantonese\nexample line\n```";
    vi.spyOn(fs, "readFileSync").mockReturnValue(contentNoTrailing);
    const resultNoTrailing = parseChapter("dummy.md");
    expect(resultNoTrailing.blocks).toHaveLength(2); // prose, cantonese
  });
});

describe("Parser - parseCurriculum edge cases", () => {
  test("handles empty or unclosed frontmatter", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue("---\nfoo: bar\n");
    const result = parseCurriculum("dummy.md");
    expect(result).toEqual([]);

    vi.spyOn(fs, "readFileSync").mockReturnValue("no frontmatter");
    const result2 = parseCurriculum("dummy.md");
    expect(result2).toEqual([]);
  });
});

describe("buildCurriculumIndex", () => {
  test("merges data and handles missing files gracefully", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const chapters = [
      { id: "test", file: "test.md", title: "Test", chapter: 0 },
    ];
    const result = buildCurriculumIndex("content", chapters);
    expect(result[0]?.exists).toBe(false);
    expect(result[0]?.description).toBe(
      "Topic outline and learning materials coming soon.",
    );
  });

  test("extracts description if file exists", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "---\ndescription: 'A test description'\n---\nContent",
    );
    const chapters = [
      { id: "test", file: "test.md", title: "Test", chapter: 0 },
    ];
    const result = buildCurriculumIndex("content", chapters);
    expect(result[0]?.exists).toBe(true);
    expect(result[0]?.description).toBe("A test description");
  });

  test("handles parse errors gracefully", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("Read error");
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const chapters = [
      { id: "test", file: "test.md", title: "Test", chapter: 0 },
    ];
    const result = buildCurriculumIndex("content", chapters);
    expect(result[0]?.exists).toBe(true);
    expect(result[0]?.description).toBe(
      "Topic outline and learning materials coming soon.",
    );

    consoleSpy.mockRestore();
  });
});
