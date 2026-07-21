import type {
  RawParsedChapter,
  ParsedBlock,
  SemanticUnit,
} from "../../src/types";
import { parse as parseYamlLib } from "yaml";
import {
  CurriculumIndexSchema,
  CurriculumChapterSchema,
} from "../../src/utils/schemas.js";

import { z } from "zod";

/**
 * Parses a standard YAML string into a JavaScript object.
 */
function parseYAML(yamlStr: string): Record<string, unknown> {
  try {
    const result: unknown = parseYamlLib(yamlStr);
    return typeof result === "object" && result !== null
      ? (result as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function extractFrontmatter(lines: string[]): {
  frontmatterStr: string;
  bodyStartLine: number;
  hasFrontmatter: boolean;
} {
  let frontmatterStr = "";
  let bodyStartLine = 1;
  let hasFrontmatter = false;

  if (lines[0] === "---") {
    let endIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === "---") {
        endIdx = i;
        break;
      }
    }
    if (endIdx !== -1) {
      frontmatterStr = lines.slice(1, endIdx).join("\n");
      bodyStartLine = endIdx + 2;
      hasFrontmatter = true;
    }
  }
  return { frontmatterStr, bodyStartLine, hasFrontmatter };
}

function createBlock(
  type: ParsedBlock["type"],
  lines: string[],
  startLine: number,
  endLine: number,
): ParsedBlock {
  return {
    type,
    content: lines.join("\n"),
    startLine,
    endLine,
  };
}

function determineBlockType(lang: string): ParsedBlock["type"] {
  return lang === "cantonese" || lang === "dialog" || lang === "exercise"
    ? lang
    : "other";
}

function parseChapterBlocks(
  bodyLines: string[],
  bodyStartLine: number,
): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let inBlock = false;
  let type: ParsedBlock["type"] = "prose";
  let lines: string[] = [];
  let startLine = bodyStartLine;

  for (let i = 0; i < bodyLines.length; i++) {
    const lineNum = bodyStartLine + i;
    const line = bodyLines[i]!;

    if (!line.startsWith("```")) {
      lines.push(line);
      continue;
    }

    if (inBlock) {
      blocks.push(createBlock(type, lines, startLine, lineNum));
      inBlock = false;
      type = "prose";
      lines = [];
      startLine = lineNum + 1;
    } else {
      if (lines.length > 0) {
        blocks.push(createBlock("prose", lines, startLine, lineNum - 1));
      }
      inBlock = true;
      type = determineBlockType(line.slice(3).trim());
      lines = [];
      startLine = lineNum;
    }
  }

  if (lines.length > 0) {
    blocks.push(
      createBlock(
        inBlock ? type : "prose",
        lines,
        startLine,
        bodyStartLine + bodyLines.length - 1,
      ),
    );
  }
  return blocks;
}

/**
 * Parses a chapter markdown file.
 *
 * @param content The raw markdown content
 * @returns Parsed chapter data
 */
export function parseChapter(content: string): RawParsedChapter {
  const lines = content.split(/\r?\n/);

  const { frontmatterStr, bodyStartLine, hasFrontmatter } =
    extractFrontmatter(lines);
  const frontmatter = hasFrontmatter ? parseYAML(frontmatterStr) : null;
  const bodyLines = hasFrontmatter ? lines.slice(bodyStartLine - 1) : lines;
  const blocks = parseChapterBlocks(bodyLines, bodyStartLine);

  return {
    frontmatter,
    blocks,
  };
}

export type CurriculumChapter = z.infer<typeof CurriculumChapterSchema>;

/**
 * Parses curriculum.md frontmatter for official chapter entries.
 *
 * @param content The raw markdown content
 * @returns List of official chapter entries
 */
export function parseCurriculum(content: string): CurriculumChapter[] {
  const lines = content.split(/\r?\n/);

  if (lines[0] === "---") {
    let endIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === "---") {
        endIdx = i;
        break;
      }
    }
    if (endIdx !== -1) {
      const frontmatterStr = lines.slice(1, endIdx).join("\n");
      const frontmatter = parseYAML(frontmatterStr);
      try {
        return CurriculumIndexSchema.parse(frontmatter.chapters);
      } catch {
        return [];
      }
    }
  }
  return [];
}

/**
 * Regex for matching Traditional Chinese characters (including extensions).
 */
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

/**
 * Extracts inline semantic units: `Char[Jyutping|Translation]`
 *
 * @param {string} text
 * @returns {Array<object>} List of matching units
 */
function extractInlineUnits(text: string): SemanticUnit[] {
  const regex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;
  const matches: SemanticUnit[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const characters = match[1]!;
    const jyutping = match[2]!;
    const translation = match[3]!;
    matches.push({
      raw,
      characters,
      jyutping,
      translation,
      index: match.index,
    });
  }
  return matches;
}

/**
 * Extracts block semantic units (no backticks): Char[Jyutping|Translation]
 *
 * @param {string} text
 * @returns {SemanticUnit[]} List of matching units
 */
function extractBlockUnits(text: string): SemanticUnit[] {
  const regex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  const matches: SemanticUnit[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const characters = match[1]!;
    const jyutping = match[2]!;
    const translation = match[3]!;
    matches.push({
      raw,
      characters,
      jyutping,
      translation,
      index: match.index,
    });
  }
  return matches;
}

export interface CurriculumIndexEntry extends CurriculumChapter {
  chapter: number;
  exists: boolean;
  description: string;
}

/**
 * Builds the curriculum index array by merging CurriculumChapter entries with their parsed frontmatter descriptions.
 * Checks for file existence and supplies defaults if the chapter file is missing.
 *
 * @param contentDir The directory path containing the chapter markdown files.
 * @param chapters The array of CurriculumChapter objects (from parseCurriculum).
 * @returns Array of CurriculumIndexEntry objects.
 */
export function buildCurriculumIndex(
  chapters: CurriculumChapter[],
  chapterContents: Record<string, string | null>,
): CurriculumIndexEntry[] {
  return chapters.map((c, index) => {
    const content = chapterContents[c.file];
    let description = "";

    if (content) {
      try {
        const chapterData = parseChapter(content);
        if (
          chapterData.frontmatter &&
          typeof chapterData.frontmatter.description === "string"
        ) {
          description = chapterData.frontmatter.description;
        }
      } catch {
        // Pure function, ignore parsing errors for descriptions
      }
    }

    return {
      ...c,
      chapter: index,
      exists: !!content,
      description:
        description.trim() ||
        "Topic outline and learning materials coming soon.",
    };
  });
}

export { parseYAML, extractInlineUnits, extractBlockUnits, CHINESE_CHAR_REGEX };
