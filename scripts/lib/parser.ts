import type {
  RawParsedChapter,
  ParsedBlock,
  SemanticUnit,
} from "../../src/types";

interface YamlState {
  result: Record<string, unknown>;
  currentKey: string;
  currentBlockValue: string | null;
  currentBlockIndent: number;
  arrayKey: string | null;
  arrayList: Record<string, unknown>[] | null;
  currentObject: Record<string, unknown> | null;
}

function parseYamlValue(v: string): unknown {
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v !== "" && !isNaN(Number(v)) ? parseInt(v, 10) : v;
}

function processYamlMultilineBlock(
  state: YamlState,
  line: string,
  indent: number,
): boolean {
  if (state.currentBlockValue === null) return false;

  if (indent > state.currentBlockIndent) {
    state.currentBlockValue += line.slice(state.currentBlockIndent + 2) + "\n";
    return true;
  } else {
    const val = state.currentBlockValue.trim();
    if (state.currentObject) {
      state.currentObject[state.currentKey] = val;
    } else {
      state.result[state.currentKey] = val;
    }
    state.currentBlockValue = null;
    state.currentBlockIndent = 0;
    state.currentKey = "";
    return false;
  }
}

function parseYamlArrayItem(state: YamlState, trimmed: string) {
  const itemContent = trimmed === "-" ? "" : trimmed.slice(2).trim();

  if (!state.arrayList) {
    state.arrayKey = state.currentKey || "chapters";
    state.arrayList = [];
    state.result[state.arrayKey] = state.arrayList;
  }

  state.currentObject = {};
  state.arrayList.push(state.currentObject);

  const colonIndex = itemContent.indexOf(":");
  if (colonIndex !== -1) {
    const k = itemContent.slice(0, colonIndex).trim();
    const v = itemContent.slice(colonIndex + 1).trim();
    state.currentObject[k] = parseYamlValue(v);
  } else {
    state.arrayList[state.arrayList.length - 1] = parseYamlValue(
      itemContent,
    ) as Record<string, unknown>;
    state.currentObject = null;
  }
}

function parseYamlStandardKeyValue(
  state: YamlState,
  trimmed: string,
  indent: number,
): boolean {
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return false;

  const k = trimmed.slice(0, colonIndex).trim();
  const v = trimmed.slice(colonIndex + 1).trim();

  if (v === "|" || v === ">") {
    state.currentKey = k;
    state.currentBlockValue = "";
    state.currentBlockIndent = indent;
    return true;
  }

  const parsedVal = parseYamlValue(v);

  if (state.currentObject) {
    state.currentObject[k] = parsedVal;
  } else {
    state.result[k] = parsedVal;
    state.currentKey = k;
  }
  return true;
}

function flushYamlBlock(state: YamlState) {
  if (state.currentBlockValue !== null) {
    const val = state.currentBlockValue.trim();
    if (state.currentObject) {
      state.currentObject[state.currentKey] = val;
    } else {
      state.result[state.currentKey] = val;
    }
  }
}

/**
 * Parses a standard YAML string into a JavaScript object.
 */
function parseYAML(yamlStr: string): Record<string, unknown> {
  const lines = yamlStr.split(/\r?\n/);
  const state: YamlState = {
    result: {},
    currentKey: "",
    currentBlockValue: null,
    currentBlockIndent: 0,
    arrayKey: null,
    arrayList: null,
    currentObject: null,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.trim() === "") {
      if (state.currentBlockValue !== null) {
        state.currentBlockValue += "\n";
      }
      continue;
    }

    const indent = line.search(/\S/);

    if (processYamlMultilineBlock(state, line, indent)) continue;

    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed === "-") {
      parseYamlArrayItem(state, trimmed);
      continue;
    }

    parseYamlStandardKeyValue(state, trimmed, indent);
  }

  flushYamlBlock(state);
  return state.result;
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

function parseChapterBlocks(
  bodyLines: string[],
  bodyStartLine: number,
): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let inBlock = false;
  let currentBlockType: ParsedBlock["type"] = "prose";
  let currentBlockLines: string[] = [];
  let currentBlockStartLine = bodyStartLine;

  for (let i = 0; i < bodyLines.length; i++) {
    const lineNum = bodyStartLine + i;
    const line = bodyLines[i]!;

    if (line.startsWith("```")) {
      if (inBlock) {
        blocks.push({
          type: currentBlockType,
          content: currentBlockLines.join("\n"),
          startLine: currentBlockStartLine,
          endLine: lineNum,
        });
        inBlock = false;
        currentBlockType = "prose";
        currentBlockLines = [];
        currentBlockStartLine = lineNum + 1;
      } else {
        if (currentBlockLines.length > 0) {
          blocks.push({
            type: "prose",
            content: currentBlockLines.join("\n"),
            startLine: currentBlockStartLine,
            endLine: lineNum - 1,
          });
        }
        inBlock = true;
        const lang = line.slice(3).trim();
        if (lang === "cantonese" || lang === "dialog" || lang === "exercise") {
          currentBlockType = lang;
        } else {
          currentBlockType = "other";
        }
        currentBlockLines = [];
        currentBlockStartLine = lineNum;
      }
    } else {
      currentBlockLines.push(line);
    }
  }

  if (currentBlockLines.length > 0) {
    blocks.push({
      type: inBlock ? currentBlockType : "prose",
      content: currentBlockLines.join("\n"),
      startLine: currentBlockStartLine,
      endLine: bodyStartLine + bodyLines.length - 1,
    });
  }
  return blocks;
}

/**
 * Parses a chapter markdown file.
 *
 * @param {string} filePath
 * @returns {RawParsedChapter}
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

export interface CurriculumChapter {
  id: string;
  file: string;
  title: string;
  chapter?: number;
}

/**
 * Parses curriculum.md frontmatter for official chapter entries.
 *
 * @param {string} filePath
 * @returns {Array<CurriculumChapter>}
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
      return Array.isArray(frontmatter.chapters)
        ? (frontmatter.chapters as unknown as CurriculumChapter[])
        : [];
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
