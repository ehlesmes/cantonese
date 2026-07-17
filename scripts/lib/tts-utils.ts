import { getCleanSpokenText as sharedCleanText } from "../../src/utils/text.js";

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
export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

import { getAudioHash as sharedGetAudioHash } from "../../src/utils/audio.js";

/**
 * Generates a SHA-256 hash matching client-side Web Crypto and slices it to 16 characters.
 */
export function getHash(text: string): string {
  return sharedGetAudioHash(text);
}

/**
 * Extracts unique spoken Cantonese strings from chapter blocks and vocabulary lists.
 */
export function extractTTSStrings(
  chaptersData: { id: string; file: string; blocks: any[] }[],
  vocabList: any[],
  includeFallbackVocab: boolean = true,
): string[] {
  const spokenTexts = new Set<string>();

  // Extract from chapters
  for (const chapter of chaptersData) {
    // A. Vocabulary matching this chapter
    const chapterVocab = vocabList.filter(
      (item) => item.firstIntroducedIn === chapter.file,
    );
    for (const item of chapterVocab) {
      if (item.character) {
        const cleanVocab = getCleanSpokenText(item.character);
        if (cleanVocab) spokenTexts.add(cleanVocab);
      }
    }

    // B. Blocks
    for (const block of chapter.blocks) {
      if (block.type === "cantonese") {
        const parts = block.content.split("===");
        const cleanCanto = getCleanSpokenText(parts[0]);
        if (cleanCanto) spokenTexts.add(cleanCanto);
      } else if (block.type === "dialog") {
        const lines = block.content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const speakerMatch = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
          if (speakerMatch) {
            const speakerCanto = speakerMatch[2] || "";
            const rawCantonese = speakerCanto.split("===")[0];
            const cleanText = getCleanSpokenText(rawCantonese);
            if (cleanText) spokenTexts.add(cleanText);
          }
        }
      } else if (block.type === "prose") {
        const inlineRegex =
          /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;
        const blockRegex =
          /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

        let match;
        while ((match = inlineRegex.exec(block.content)) !== null) {
          if (match[1] !== undefined) spokenTexts.add(match[1]);
        }
        while ((match = blockRegex.exec(block.content)) !== null) {
          if (match[1] !== undefined) spokenTexts.add(match[1]);
        }
      }
    }
  }

  // C. Fallback vocab
  if (includeFallbackVocab) {
    for (const item of vocabList) {
      if (item.character) {
        const cleanVocab = getCleanSpokenText(item.character);
        if (cleanVocab && !spokenTexts.has(cleanVocab)) {
          spokenTexts.add(cleanVocab);
        }
      }
    }
  }

  return Array.from(spokenTexts);
}
