import fs from "fs";
import path from "path";
import { parseCurriculum, parseChapter } from "../../../scripts/lib/parser.js";
import {
  parseDialogueBlock,
  parseExampleBlock,
} from "../../../src/utils/markdown.js";
import { getAudioHash, getTokenHashes } from "../../../src/utils/audio.js";
import {
  getStablePhraseId,
  splitCantoneseTokens,
} from "../../../src/utils/text.js";
import { CurriculumIndexSchema } from "../../utils/schemas.js";

import type { APIRoute } from "astro";

interface CurriculumChapter {
  id: string;
  file: string;
  title: string;
}

interface ExampleItem {
  id: string;
  chapter: string;
  chapterNumber: number;
  chapterTitle: string;
  practiceType: "phrase";
  cantoneseRaw: string;
  english: string;
  tokens: string[];
  type: string;
  audioHash: string;
  tokenHashes: Record<string, string>;
}

async function extractExamplesFromBlock(
  block: { type: string; content: string },
  chapter: CurriculumChapter,
  chapterNumber: number,
): Promise<ExampleItem[]> {
  const examples: ExampleItem[] = [];

  if (block.type === "cantonese") {
    const { cantoneseRaw, translationRaw: english } = parseExampleBlock(
      block.content,
    );

    if (cantoneseRaw && english) {
      examples.push({
        id: getStablePhraseId(cantoneseRaw),
        chapter: chapter.id,
        chapterNumber,
        chapterTitle: chapter.title,
        practiceType: "phrase",
        cantoneseRaw,
        english,
        tokens: splitCantoneseTokens(cantoneseRaw),
        type: "example",
        audioHash: await getAudioHash(cantoneseRaw),
        tokenHashes: await getTokenHashes(cantoneseRaw),
      });
    }
  } else if (block.type === "dialog") {
    const turns = parseDialogueBlock(block.content);
    for (const turn of turns) {
      if (turn.cantonese && turn.english) {
        examples.push({
          id: getStablePhraseId(turn.cantonese),
          chapter: chapter.id,
          chapterNumber,
          chapterTitle: chapter.title,
          practiceType: "phrase",
          cantoneseRaw: turn.cantonese,
          english: turn.english,
          tokens: splitCantoneseTokens(turn.cantonese),
          type: "dialog",
          audioHash: await getAudioHash(turn.cantonese),
          tokenHashes: await getTokenHashes(turn.cantonese),
        });
      }
    }
  }

  return examples;
}

export const GET: APIRoute = async () => {
  const curriculumPath = path.resolve("content/curriculum.md");
  const curriculumContent = fs.readFileSync(curriculumPath, "utf8");
  const chapters = parseCurriculum(curriculumContent);
  CurriculumIndexSchema.parse(chapters);

  const extractPromises = chapters.flatMap((chapter, idx) => {
    const filePath = path.resolve("content", chapter.file);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf8");
    const { blocks } = parseChapter(content);
    return blocks.map((block) => extractExamplesFromBlock(block, chapter, idx));
  });

  const nestedExamples = await Promise.all(extractPromises);
  const allExamples = nestedExamples.flat();

  return new Response(JSON.stringify(allExamples), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
