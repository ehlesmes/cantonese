import { getStablePhraseId, getStableVocabId } from "./text";
import {
  parseExampleBlock,
  compileMarkdown,
  parseExerciseBlock,
} from "./markdown";
import type {
  CurriculumChapter,
  CurriculumIndexEntry,
} from "../../scripts/lib/parser";
import type { ParsedBlock, RawParsedChapter } from "../types";

interface VocabItem {
  firstIntroducedIn: string;
  character: string;
  jyutping: string;
}

export interface AdvancedChapterData {
  id: string;
  title: string;
  number: number;
  exists: boolean;
  phrases: string[];
  vocab: string[];
}

/**
 * Aggregates phrase and vocabulary IDs for the advanced progress page.
 */
export function compileAdvancedChapterData(
  chapters: CurriculumChapter[],
  vocabDb: VocabItem[],
  chapterContents: Record<string, RawParsedChapter | null>,
): AdvancedChapterData[] {
  const allChaptersData: AdvancedChapterData[] = [];

  chapters.forEach((chapter, idx) => {
    const chapterData = chapterContents[chapter.file];
    const phraseIds: string[] = [];

    if (chapterData && chapterData.blocks) {
      for (const block of chapterData.blocks) {
        if (block.type === "cantonese") {
          const { cantoneseRaw, translationRaw: english } = parseExampleBlock(
            block.content,
          );
          if (cantoneseRaw && english) {
            phraseIds.push(getStablePhraseId(cantoneseRaw));
          }
        }
      }
    }

    const vocabIds = vocabDb
      .filter((item) => item.firstIntroducedIn === chapter.id)
      .map((item) => getStableVocabId(item.character, item.jyutping));

    allChaptersData.push({
      id: chapter.id,
      title: chapter.title,
      number: idx,
      exists: !!chapterData,
      phrases: phraseIds,
      vocab: vocabIds,
    });
  });

  return allChaptersData;
}

export interface ProcessedProseBlock {
  type: "prose";
  html: string;
}

export interface ProcessedCantoneseBlock {
  type: "cantonese";
  content: string;
}

export interface ProcessedDialogBlock {
  type: "dialog";
  content: string;
}

export type ProcessedExerciseBlock = {
  type: "exercise";
} & Record<string, unknown>;

export type ProcessedBlockType =
  | ProcessedProseBlock
  | ProcessedCantoneseBlock
  | ProcessedDialogBlock
  | ProcessedExerciseBlock;

/**
 * Pre-processes markdown blocks for the chapter page.
 */
export async function processChapterBlocks(
  blocks: ParsedBlock[],
  parseYAML: (yaml: string) => Record<string, unknown>,
): Promise<ProcessedBlockType[]> {
  const processedPromises = blocks.map(async (block) => {
    if (block.type === "prose") {
      return {
        type: "prose",
        html: await compileMarkdown(block.content),
      } as ProcessedProseBlock;
    }
    if (block.type === "cantonese") {
      return {
        type: "cantonese",
        content: block.content,
      } as ProcessedCantoneseBlock;
    }
    if (block.type === "dialog") {
      return {
        type: "dialog",
        content: block.content,
      } as ProcessedDialogBlock;
    }
    if (block.type === "exercise") {
      try {
        const parsedEx = await parseExerciseBlock(block.content, parseYAML);
        return {
          type: "exercise",
          ...parsedEx,
        } as ProcessedExerciseBlock;
      } catch {
        // Pure function, do not log console.error directly
        return null;
      }
    }
    return null;
  });

  const resolved = await Promise.all(processedPromises);
  return resolved.filter((b): b is ProcessedBlockType => b !== null);
}

interface ChapterExistence {
  exists: boolean;
  id: string;
}

/**
 * Calculates prev/next navigation links for the chapter page.
 */
export function calculateNavigation<T extends ChapterExistence>(
  allChapters: T[],
  currentId: string,
): { prevChapter: T | null; nextChapter: T | null } {
  const existingChapters = allChapters.filter((c) => c.exists);
  const currentIndex = existingChapters.findIndex((c) => c.id === currentId);

  const prevChapter =
    currentIndex > 0 ? existingChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex !== -1 && currentIndex < existingChapters.length - 1
      ? existingChapters[currentIndex + 1]
      : null;

  return {
    prevChapter: prevChapter ?? null,
    nextChapter: nextChapter ?? null,
  };
}

export interface ChapterStaticPath {
  params: { id: string };
  props: {
    filePath: string;
    chapterNumber: number;
    allChapters: {
      chapter: number;
      title: string;
      id: string;
      exists: boolean;
    }[];
  };
}

/**
 * Builds the static paths array for Astro's getStaticPaths.
 */
export function buildChapterPaths(
  entries: CurriculumIndexEntry[],
  contentDir: string,
  pathJoin: (p1: string, p2: string) => string,
): ChapterStaticPath[] {
  const allChapters = entries.map((c) => ({
    chapter: c.chapter,
    title: c.title,
    id: c.id,
    exists: c.exists,
  }));

  const paths: ChapterStaticPath[] = [];
  for (const entry of entries) {
    if (entry.exists) {
      paths.push({
        params: { id: entry.id },
        props: {
          filePath: pathJoin(contentDir, entry.file),
          chapterNumber: entry.chapter,
          allChapters,
        },
      });
    }
  }
  return paths;
}
