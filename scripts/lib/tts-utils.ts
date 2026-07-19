import { getCleanSpokenText as sharedCleanText } from "../../src/utils/text.js";
import type { ParsedBlock } from "../../src/types";

import { getAudioHash as sharedGetAudioHash } from "../../src/utils/audio.js";

export interface TtsVocabItem {
  firstIntroducedIn?: string;
  character?: string;
}

/**
 * Strips annotations, brackets, and backticks from Cantonese text to get clean spoken text.
 * E.g., `你好[nei5hou2|hello]` -> 你好
 */
export function getCleanSpokenText(text: string | null | undefined): string {
  return sharedCleanText(text);
}

/**
 * Escapes special XML characters for Azure Speech SSML payload.
 */
const XML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c] as string);
}

/**
 * Generates a SHA-256 hash matching client-side Web Crypto and slices it to 16 characters.
 */
export function getHash(text: string): string {
  return sharedGetAudioHash(text);
}

function extractFromVocabList(
  vocabList: TtsVocabItem[],
  spokenTexts: Set<string>,
  chapterFile?: string,
) {
  const items = chapterFile
    ? vocabList.filter((item) => item.firstIntroducedIn === chapterFile)
    : vocabList;

  for (const item of items) {
    if (item.character) {
      const cleanVocab = getCleanSpokenText(item.character);
      if (cleanVocab && !spokenTexts.has(cleanVocab)) {
        spokenTexts.add(cleanVocab);
      }
    }
  }
}

function extractFromDialogBlock(content: string, spokenTexts: Set<string>) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const speakerMatch = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
    if (!speakerMatch) continue;

    const speakerCanto = speakerMatch[2] as string;
    const rawCantonese = speakerCanto.split("===")[0]!;
    const cleanText = getCleanSpokenText(rawCantonese);
    if (cleanText) spokenTexts.add(cleanText);
  }
}

function extractFromProseBlock(content: string, spokenTexts: Set<string>) {
  const inlineRegex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  let match;
  while ((match = inlineRegex.exec(content)) !== null) {
    spokenTexts.add(match[1]!);
  }
  while ((match = blockRegex.exec(content)) !== null) {
    spokenTexts.add(match[1]!);
  }
}

function extractFromBlock(block: ParsedBlock, spokenTexts: Set<string>) {
  switch (block.type) {
    case "cantonese": {
      const parts = block.content.split("===");
      const cleanCanto = getCleanSpokenText(parts[0]);
      if (cleanCanto) spokenTexts.add(cleanCanto);
      break;
    }
    case "dialog": {
      extractFromDialogBlock(block.content, spokenTexts);
      break;
    }
    case "prose": {
      extractFromProseBlock(block.content, spokenTexts);
      break;
    }
  }
}

/**
 * Extracts unique spoken Cantonese strings from chapter blocks and vocabulary lists.
 */
export function extractTTSStrings(
  chaptersData: { id: string; file: string; blocks: ParsedBlock[] }[],
  vocabList: TtsVocabItem[],
  includeFallbackVocab: boolean = true,
): string[] {
  const spokenTexts = new Set<string>();

  for (const chapter of chaptersData) {
    extractFromVocabList(vocabList, spokenTexts, chapter.file);

    for (const block of chapter.blocks) {
      extractFromBlock(block, spokenTexts);
    }
  }

  if (includeFallbackVocab) {
    extractFromVocabList(vocabList, spokenTexts);
  }

  return Array.from(spokenTexts);
}
