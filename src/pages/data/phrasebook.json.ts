import fs from "fs";
import path from "path";
import { parseCurriculum, parseChapter } from "../../../scripts/lib/parser";
import {
  parseDialogueBlock,
  parseExampleBlock,
} from "../../../src/utils/markdown";
import { getAudioHash } from "../../../src/utils/audio.js";
import { getStablePhraseId } from "../../../src/utils/text.js";
import { CurriculumIndexSchema } from "../../utils/schemas";

import type { APIRoute } from "astro";

function getTokenHashes(
  text: string | null | undefined,
): Record<string, string> {
  const tokenHashes: Record<string, string> = {};
  if (!text) return tokenHashes;
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const char = match[1];
    if (!char) continue;
    tokenHashes[char] = getAudioHash(char);
  }
  return tokenHashes;
}

function splitCantoneseTokens(
  cantoneseRaw: string | null | undefined,
): string[] {
  if (!cantoneseRaw) return [];
  const spaced = cantoneseRaw.replace(/([，。！？、；：,?!;:])/g, " $1 ");
  const regex = /([^\s[]+\[[^\]]+\]|[^\s[]+)/g;
  return spaced.match(regex) || [];
}

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

function extractExamplesFromBlock(
  block: { type: string; content: string },
  chapter: CurriculumChapter,
  chapterNumber: number,
): ExampleItem[] {
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
        audioHash: getAudioHash(cantoneseRaw),
        tokenHashes: getTokenHashes(cantoneseRaw),
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
          audioHash: getAudioHash(turn.cantonese),
          tokenHashes: getTokenHashes(turn.cantonese),
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

  const allExamples: ExampleItem[] = chapters.flatMap((chapter, idx) => {
    const filePath = path.resolve("content", chapter.file);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf8");
    const { blocks } = parseChapter(content);
    return blocks.flatMap((block) =>
      extractExamplesFromBlock(block, chapter, idx),
    );
  });

  return new Response(JSON.stringify(allExamples), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
