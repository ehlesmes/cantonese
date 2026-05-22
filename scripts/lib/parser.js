const fs = require("fs");

/**
 * Parses a standard YAML string into a JavaScript object.
 * Supports flat key-values, integers, single/double quotes,
 * multiline strings using '|', and arrays of objects starting with '-'.
 *
 * @param {string} yamlStr
 * @returns {object}
 */
function parseYAML(yamlStr) {
  const lines = yamlStr.split(/\r?\n/);
  const result = {};
  let currentKey = null;
  let currentBlockValue = null;
  let currentBlockIndent = null;

  let arrayKey = null;
  let arrayList = null;
  let currentObject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines unless inside a multiline block
    if (line.trim() === "") {
      if (currentBlockValue !== null) {
        currentBlockValue += "\n";
      }
      continue;
    }

    const indent = line.search(/\S/);
    if (indent === -1) continue;

    // Process ongoing multiline block
    if (currentBlockValue !== null) {
      if (indent > currentBlockIndent) {
        // Keep the content past the block indent indentation
        currentBlockValue += line.slice(currentBlockIndent + 2) + "\n";
        continue;
      } else {
        // Block ended, save the accumulated string
        const val = currentBlockValue.trim();
        if (currentObject) {
          currentObject[currentKey] = val;
        } else {
          result[currentKey] = val;
        }
        currentBlockValue = null;
        currentBlockIndent = null;
        currentKey = null;
      }
    }

    const trimmed = line.trim();

    // Array item list start: e.g. "- chapter: 0"
    if (trimmed.startsWith("- ")) {
      const itemContent = trimmed.slice(2).trim();

      if (!arrayList) {
        arrayKey = currentKey || "chapters";
        arrayList = [];
        result[arrayKey] = arrayList;
      }

      currentObject = {};
      arrayList.push(currentObject);

      if (itemContent) {
        const colonIndex = itemContent.indexOf(":");
        if (colonIndex !== -1) {
          const k = itemContent.slice(0, colonIndex).trim();
          let v = itemContent.slice(colonIndex + 1).trim();

          if (
            (v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))
          ) {
            v = v.slice(1, -1);
          }

          const parsedVal = v !== "" && !isNaN(v) ? parseInt(v, 10) : v;
          currentObject[k] = parsedVal;
        }
      }
      continue;
    }

    // Standard key-value parsing
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex !== -1) {
      const k = trimmed.slice(0, colonIndex).trim();
      let v = trimmed.slice(colonIndex + 1).trim();

      if (v === "|" || v === ">") {
        currentKey = k;
        currentBlockValue = "";
        currentBlockIndent = indent;
        continue;
      }

      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }

      const parsedVal = v !== "" && !isNaN(v) ? parseInt(v, 10) : v;

      if (currentObject) {
        currentObject[k] = parsedVal;
      } else {
        result[k] = parsedVal;
        currentKey = k; // track in case array items follow
      }
    }
  }

  // Flush any lingering multiline block
  if (currentBlockValue !== null) {
    const val = currentBlockValue.trim();
    if (currentObject) {
      currentObject[currentKey] = val;
    } else {
      result[currentKey] = val;
    }
  }

  return result;
}

/**
 * Parses a chapter markdown file into structured metadata and blocks.
 *
 * @param {string} filePath
 * @returns {object} { frontmatter, blocks }
 */
function parseChapter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

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

  const frontmatter = hasFrontmatter ? parseYAML(frontmatterStr) : null;
  const blocks = [];

  let inBlock = false;
  let currentBlockType = "prose";
  let currentBlockLines = [];
  let currentBlockStartLine = bodyStartLine;

  const bodyLines = hasFrontmatter ? lines.slice(bodyStartLine - 1) : lines;

  for (let i = 0; i < bodyLines.length; i++) {
    const lineNum = bodyStartLine + i;
    const line = bodyLines[i];

    if (line.startsWith("```")) {
      if (inBlock) {
        // End code block
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
        // Push preceding prose block
        if (currentBlockLines.length > 0) {
          blocks.push({
            type: "prose",
            content: currentBlockLines.join("\n"),
            startLine: currentBlockStartLine,
            endLine: lineNum - 1,
          });
        }

        // Start code block
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

  // Push remaining prose
  if (currentBlockLines.length > 0) {
    blocks.push({
      type: inBlock ? currentBlockType : "prose",
      content: currentBlockLines.join("\n"),
      startLine: currentBlockStartLine,
      endLine: bodyStartLine + bodyLines.length - 1,
    });
  }

  return {
    frontmatter,
    blocks,
  };
}

/**
 * Parses curriculum.md frontmatter for official chapter entries.
 *
 * @param {string} filePath
 * @returns {Array<object>}
 */
function parseCurriculum(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
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
      return frontmatter.chapters || [];
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
function extractInlineUnits(text) {
  const regex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      raw: match[0],
      characters: match[1],
      jyutping: match[2],
      translation: match[3],
      index: match.index,
    });
  }
  return matches;
}

/**
 * Extracts block semantic units (no backticks): Char[Jyutping|Translation]
 *
 * @param {string} text
 * @returns {Array<object>} List of matching units
 */
function extractBlockUnits(text) {
  const regex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      raw: match[0],
      characters: match[1],
      jyutping: match[2],
      translation: match[3],
      index: match.index,
    });
  }
  return matches;
}

module.exports = {
  parseYAML,
  parseChapter,
  parseCurriculum,
  extractInlineUnits,
  extractBlockUnits,
  CHINESE_CHAR_REGEX,
};
