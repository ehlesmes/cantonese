import fs from "fs";
import { describe, test, expect, vi } from "vitest";
import { parseYAML, parseChapter, parseCurriculum } from "./parser.js";

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
    const result = parseYAML(yaml);
    expect(result.list).toHaveLength(2);
    expect(result.list[0].key).toBe("value1");
    expect(result.list[1].key).toBe("value2");
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

  test("handles unclosed code blocks", () => {
    const content = "prose line\n```cantonese\nexample line\n";
    vi.spyOn(fs, "readFileSync").mockReturnValue(content);
    const result = parseChapter("dummy.md");
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks.at(0)?.type).toBe("prose");
    expect(result.blocks.at(1)?.type).toBe("cantonese");
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
