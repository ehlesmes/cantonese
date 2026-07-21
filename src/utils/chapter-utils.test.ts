import { describe, test, expect, vi } from "vitest";
import type { CurriculumChapter } from "../../scripts/lib/parser";
import type { ParsedBlock, RawParsedChapter } from "../types";
import {
  compileAdvancedChapterData,
  processChapterBlocks,
  calculateNavigation,
  buildChapterPaths,
} from "./chapter-utils";

vi.mock("./markdown", () => ({
  compileMarkdown: (content: string) => `<p>${content}</p>`,
  parseExampleBlock: (content: string) => {
    if (content.includes("invalid")) {
      return { cantoneseRaw: null, translationRaw: null };
    }
    return { cantoneseRaw: content, translationRaw: "translation" };
  },
  parseExerciseBlock: (content: string) => {
    if (content.includes("invalid")) throw new Error("Invalid exercise block");
    return { question: content };
  },
}));

vi.mock("./text", () => ({
  getStablePhraseId: (raw: string) => `phrase-${raw}`,
  getStableVocabId: (char: string, jyut: string) => `vocab-${char}-${jyut}`,
}));

describe("chapter-utils Spec", () => {
  test("compileAdvancedChapterData groups vocabulary and phrases", () => {
    const chapters = [
      { id: "chap-1", title: "Chapter 1", file: "01.md" },
      { id: "chap-2", title: "Chapter 2", file: "02.md" },
      { id: "chap-3", title: "Missing", file: "03.md" },
    ] as unknown as CurriculumChapter[];

    const vocabDb = [
      { firstIntroducedIn: "chap-1", character: "你", jyutping: "nei5" },
      { firstIntroducedIn: "chap-2", character: "好", jyutping: "hou2" },
    ] as Parameters<typeof compileAdvancedChapterData>[1];

    const chapterContents = {
      "01.md": {
        blocks: [
          { type: "cantonese", content: "valid phrase" },
          { type: "cantonese", content: "invalid phrase" },
          { type: "vocabulary", content: "vocab-你-nei5" },
        ],
      },
      "02.md": {
        blocks: [{ type: "vocabulary", content: "vocab-好-hou2" }],
      },
      "03.md": null,
    } as unknown as Record<string, RawParsedChapter | null>;

    const res = compileAdvancedChapterData(chapters, vocabDb, chapterContents);

    expect(res).toHaveLength(3);
    expect(res[0]!.exists).toBe(true);
    expect(res[0]!.phrases).toEqual(["phrase-valid phrase"]);
    expect(res[0]!.vocab).toEqual(["vocab-你-nei5"]);
    expect(res[0]!.number).toBe(0);

    expect(res[1]!.exists).toBe(true);
    expect(res[1]!.phrases).toEqual([]);
    expect(res[1]!.vocab).toEqual(["vocab-好-hou2"]);

    expect(res[2]!.exists).toBe(false);
    expect(res[2]!.phrases).toEqual([]);
    expect(res[2]!.vocab).toEqual([]);
  });

  test("compileAdvancedChapterData with null blocks", () => {
    const chapters = [
      { id: "chap-1", title: "Chapter 1", file: "01.md" },
    ] as unknown as CurriculumChapter[];
    const chapterContents = { "01.md": { blocks: null } } as unknown as Record<
      string,
      RawParsedChapter | null
    >;
    const res = compileAdvancedChapterData(chapters, [], chapterContents);
    expect(res[0]!.phrases).toEqual([]);
  });

  test("processChapterBlocks parses blocks correctly", async () => {
    const blocks = [
      { type: "prose", content: "Prose" },
      { type: "cantonese", content: "Cantonese" },
      { type: "dialog", content: "Dialog" },
      { type: "exercise", content: "Exercise" },
      { type: "exercise", content: "invalid" },
      { type: "other", content: "ignored" },
    ] as unknown as ParsedBlock[];

    const parseYAML = vi.fn();
    const res = await processChapterBlocks(blocks, parseYAML);

    expect(res).toHaveLength(4);
    expect(res[0]!.type).toBe("prose");
    expect((res[0] as unknown as { html: string }).html).toBe("<p>Prose</p>");

    expect(res[1]!.type).toBe("cantonese");
    expect((res[1] as unknown as { content: string }).content).toBe(
      "Cantonese",
    );

    expect(res[2]!.type).toBe("dialog");
    expect((res[2] as unknown as { content: string }).content).toBe("Dialog");

    expect(res[3]!.type).toBe("exercise");
    expect((res[3] as unknown as { question: string }).question).toBe(
      "Exercise",
    );
  });

  test("calculateNavigation handles prev/next boundaries", () => {
    const allChapters = [
      { exists: false, id: "00" },
      { exists: true, id: "01" },
      { exists: true, id: "02" },
      { exists: true, id: "03" },
      { exists: false, id: "04" },
    ];

    const nav1 = calculateNavigation(allChapters, "01");
    expect(nav1.prevChapter).toBeNull();
    expect(nav1.nextChapter!.id).toBe("02");

    const nav2 = calculateNavigation(allChapters, "02");
    expect(nav2.prevChapter!.id).toBe("01");
    expect(nav2.nextChapter!.id).toBe("03");

    const nav3 = calculateNavigation(allChapters, "03");
    expect(nav3.prevChapter!.id).toBe("02");
    expect(nav3.nextChapter).toBeNull();

    // Not found
    const nav4 = calculateNavigation(allChapters, "99");
    expect(nav4.prevChapter).toBeNull();
    expect(nav4.nextChapter).toBeNull();
  });

  test("buildChapterPaths correctly generates paths for Astro", () => {
    const entries = [
      {
        id: "chap-1",
        title: "Chapter 1",
        file: "01.md",
        chapter: 0,
        exists: true,
      },
      {
        id: "chap-2",
        title: "Chapter 2",
        file: "02.md",
        chapter: 1,
        exists: false,
      },
      {
        id: "chap-3",
        title: "Chapter 3",
        file: "03.md",
        chapter: 2,
        exists: true,
      },
    ] as unknown as import("../../scripts/lib/parser").CurriculumIndexEntry[];

    const pathJoin = (p1: string, p2: string) => `${p1}/${p2}`;

    const paths = buildChapterPaths(entries, "/fake/content", pathJoin);

    expect(paths).toHaveLength(2);

    // First existing chapter
    expect(paths[0]!.params.id).toBe("chap-1");
    expect(paths[0]!.props.filePath).toBe("/fake/content/01.md");
    expect(paths[0]!.props.chapterNumber).toBe(0);
    expect(paths[0]!.props.allChapters).toHaveLength(3);

    // Second existing chapter
    expect(paths[1]!.params.id).toBe("chap-3");
    expect(paths[1]!.props.filePath).toBe("/fake/content/03.md");
    expect(paths[1]!.props.chapterNumber).toBe(2);
  });
});
