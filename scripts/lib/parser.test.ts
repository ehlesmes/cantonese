import { describe, test, expect } from "vitest";
import {
  parseYAML,
  parseChapter,
  parseCurriculum,
  buildCurriculumIndex,
} from "./parser.js";

describe("Parser - parseYAML", () => {
  test("parses flat key-values with missing colons", () => {
    const yaml = `key1: value1
key2: value2
key3 value3`; // missing colon
    const result = parseYAML(yaml);
    expect(result).toEqual({}); // standard yaml parser throws, returning fallback {}
  });

  test("handles empty string gracefully", () => {
    expect(parseYAML("")).toEqual({});
  });
});

describe("Parser - parseChapter edge cases", () => {
  test("handles unclosed frontmatter and undefined lines", () => {
    const content = "---\nid: 01\n";
    const result = parseChapter(content);
    expect(result.frontmatter).toBeNull();
  });

  test("properly counts blocks with trailing newlines", () => {
    const content = "prose line\n```cantonese\nexample line\n```\n";
    const result = parseChapter(content);
    expect(result.blocks).toHaveLength(3); // prose, cantonese, trailing empty prose

    const contentUnclosed = "prose line\n```cantonese\nexample line";
    const resultUnclosed = parseChapter(contentUnclosed);
    expect(resultUnclosed.blocks).toHaveLength(2);

    const contentNoTrailing = "prose line\n```cantonese\nexample line\n```";
    const resultNoTrailing = parseChapter(contentNoTrailing);
    expect(resultNoTrailing.blocks).toHaveLength(2); // prose, cantonese
  });
});

describe("Parser - parseCurriculum edge cases", () => {
  test("handles empty or unclosed frontmatter", () => {
    const result = parseCurriculum("---\nfoo: bar\n");
    expect(result).toEqual([]);

    const result2 = parseCurriculum("no frontmatter");
    expect(result2).toEqual([]);
  });
});

describe("buildCurriculumIndex", () => {
  test("merges data and handles missing files gracefully", () => {
    const chapters = [
      { id: "test", file: "test.md", title: "Test", chapter: 0 },
    ];
    const contents = { "test.md": null };
    const result = buildCurriculumIndex(chapters, contents);
    expect(result[0]?.exists).toBe(false);
    expect(result[0]?.description).toBe(
      "Topic outline and learning materials coming soon.",
    );
  });

  test("extracts description if file exists", () => {
    const chapters = [
      { id: "test", file: "test.md", title: "Test", chapter: 0 },
    ];
    const contents = {
      "test.md": "---\ndescription: 'A test description'\n---\nContent",
    };
    const result = buildCurriculumIndex(chapters, contents);
    expect(result[0]?.exists).toBe(true);
    expect(result[0]?.description).toBe("A test description");
  });
  test("buildCurriculumIndex - handles malformed chapter frontmatter gracefully", () => {
    const chapters = [
      { chapter: 1, title: "Test", file: "01-test.md", id: "test" },
    ];
    const contentMap = {
      "01-test.md": "---\nmalformed yaml\n---\n# Test",
    };

    const index = buildCurriculumIndex(chapters, contentMap);

    expect(index).toHaveLength(1);
    expect(index[0]!.description).toBe(
      "Topic outline and learning materials coming soon.",
    );
  });
});
