import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parseCurriculum, parseChapter } from "../../../scripts/lib/parser";

import type { APIRoute } from "astro";

function getCleanSpokenText(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = text;
  const annotationRegex =
    /`?([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`?/g;
  cleaned = cleaned.replace(annotationRegex, (_match, char) => char);
  cleaned = cleaned.replace(/\[[^\]]+\]/g, "");
  return cleaned.trim();
}

function getAudioHash(text: string | null | undefined): string {
  const clean = getCleanSpokenText(text);
  return crypto.createHash("sha256").update(clean).digest("hex").slice(0, 16);
}

function getTokenHashes(text: string | null | undefined): Record<string, string> {
  const tokenHashes: Record<string, string> = {};
  if (!text) return tokenHashes;
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const char = match[1];
    if (!char) continue;
    tokenHashes[char] = crypto
      .createHash("sha256")
      .update(char)
      .digest("hex")
      .slice(0, 16);
  }
  return tokenHashes;
}

function splitCantoneseTokens(cantoneseRaw: string | null | undefined): string[] {
  if (!cantoneseRaw) return [];
  const spaced = cantoneseRaw.replace(/([，。！？、；：,?!;:])/g, " $1 ");
  const regex = /([^\s[]+\[[^\]]+\]|[^\s[]+)/g;
  return spaced.match(regex) || [];
}

function getStablePhraseId(text: string): string {
  const clean = text
    .replace(
      /`?([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`?/g,
      "$1",
    )
    .replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9]/g, "");
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 33) ^ clean.charCodeAt(i);
  }
  const hashStr = (hash >>> 0).toString(36);
  return `phr-${clean.length}-${hashStr}`;
}

export const GET: APIRoute = async () => {
  const curriculumPath = path.resolve("content/curriculum.md");
  const chapters = parseCurriculum(curriculumPath);
  const allExamples: any[] = [];

  chapters.forEach((chapter: any, idx: number) => {
    const file = chapter.file;
    const filePath = path.resolve("content", file);
    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
      const { blocks } = parseChapter(filePath);

      for (const block of blocks) {
        if (block.type === "cantonese") {
          const parts = block.content.split("===");
          const cantoneseRaw = parts[0] ? parts[0].trim() : "";
          const english = parts[1] ? parts[1].trim() : "";

          if (cantoneseRaw && english) {
            const tokens = splitCantoneseTokens(cantoneseRaw);
            allExamples.push({
              id: getStablePhraseId(cantoneseRaw),
              chapter: chapter.id,
              chapterNumber: idx,
              chapterTitle: chapter.title,
              cantoneseRaw,
              english,
              tokens,
              type: "example",
              audioHash: getAudioHash(cantoneseRaw),
              tokenHashes: getTokenHashes(cantoneseRaw),
            });
          }
        } else if (block.type === "dialog") {
          const lines = block.content.split(/\r?\n/);
          let currentTurn: any = null;

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const speakerMatch = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
            if (speakerMatch) {
              if (
                currentTurn &&
                currentTurn.cantoneseRaw &&
                currentTurn.english
              ) {
                currentTurn.audioHash = getAudioHash(currentTurn.cantoneseRaw);
                currentTurn.tokenHashes = getTokenHashes(
                  currentTurn.cantoneseRaw,
                );
                allExamples.push(currentTurn);
              }
              const rawCanto = speakerMatch[2] || "";
              currentTurn = {
                id: getStablePhraseId(rawCanto),
                chapter: chapter.id,
                chapterNumber: idx,
                chapterTitle: chapter.title,
                cantoneseRaw: rawCanto,
                english: "",
                tokens: splitCantoneseTokens(rawCanto),
                type: "dialog",
                audioHash: "",
                tokenHashes: {},
              };
            } else if (trimmed.startsWith("===")) {
              if (currentTurn) {
                currentTurn.english = trimmed.slice(3).trim();
              }
            } else {
              if (currentTurn) {
                currentTurn.cantoneseRaw += " " + trimmed;
                currentTurn.tokens = splitCantoneseTokens(
                  currentTurn.cantoneseRaw,
                );
                currentTurn.id = getStablePhraseId(currentTurn.cantoneseRaw);
              }
            }
          }
          if (currentTurn && currentTurn.cantoneseRaw && currentTurn.english) {
            currentTurn.audioHash = getAudioHash(currentTurn.cantoneseRaw);
            currentTurn.tokenHashes = getTokenHashes(currentTurn.cantoneseRaw);
            allExamples.push(currentTurn);
          }
        }
      }
    }
  });

  return new Response(JSON.stringify(allExamples), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
