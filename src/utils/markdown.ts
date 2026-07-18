import { marked } from "marked";
import crypto from "node:crypto";
import type { CompileMarkdownOptions } from "../types";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Compiles a raw annotated markdown string (prose) into HTML with tooltips.
 * Converts inline `Char[Jyutping|Translation]` (with backticks) to tooltips.
 *
 * @param text
 * @param [options={}] Options object (e.g. { inline: true })
 * @returns Compiled HTML
 */
export function compileMarkdown(
  text: string | null | undefined,
  options: CompileMarkdownOptions = {},
): string {
  if (!text) return "";

  // Regex to match: `Char[Jyutping|Translation]` (with backticks)
  const inlineRegex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  // Replace backtick-wrapped annotations
  let processedText = text.replace(
    inlineRegex,
    (_match: string, char: string, jyutping: string, translation: string) => {
      const hash = crypto
        .createHash("sha256")
        .update(char)
        .digest("hex")
        .slice(0, 16);
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );

  // Replace plain annotations (without backticks)
  processedText = processedText.replace(
    blockRegex,
    (_match: string, char: string, jyutping: string, translation: string) => {
      const hash = crypto
        .createHash("sha256")
        .update(char)
        .digest("hex")
        .slice(0, 16);
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );

  const parseOptions: { breaks?: boolean } = {};
  if (options.breaks !== undefined) {
    parseOptions.breaks = options.breaks;
  }

  const htmlString = options.inline
    ? (marked.parseInline(processedText, parseOptions) as string)
    : (marked.parse(processedText, parseOptions) as string);

  // Regex to match blockquote alerts: <blockquote><p>[!NOTE] ... </blockquote>
  const alertRegex =
    /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/blockquote>/gi;

  // Replace blockquotes with div alert cards
  return htmlString.replace(
    alertRegex,
    (_match: string, type: string, content: string) => {
      return `<div class="alert-box alert-${type.toLowerCase()}">
      <div class="alert-title">${type}</div>
      <div class="alert-content"><p>${content.trim()}</div>
    </div>`;
    },
  );
}

/**
 * Compiles plain text annotations (without backticks) used in examples/dialogs.
 * Converts Char[Jyutping|Translation] to tooltip markup.
 *
 * @param text
 * @returns Compiled HTML
 */
export function compileAnnotations(text: string | null | undefined): string {
  if (!text) return "";

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  return text.replace(
    blockRegex,
    (_match: string, char: string, jyutping: string, translation: string) => {
      const hash = crypto
        .createHash("sha256")
        .update(char)
        .digest("hex")
        .slice(0, 16);
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );
}

export interface DialogueTurn {
  speaker: string;
  cantonese: string;
  english: string;
}

/**
 * Parses a raw dialogue block string into an array of structured turns.
 *
 * @param content The raw string from the markdown file.
 * @returns Array of DialogueTurn objects.
 */
export function parseDialogueBlock(content: string): DialogueTurn[] {
  const lines = content.split(/\r?\n/);
  const turns: DialogueTurn[] = [];
  let currentTurn: DialogueTurn | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (!trimmed) continue;

    const speakerMatch = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
    if (speakerMatch) {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        speaker: speakerMatch[1]!,
        cantonese: speakerMatch[2]!,
        english: "",
      };
    } else if (trimmed.startsWith("===")) {
      if (currentTurn) {
        currentTurn.english = trimmed.slice(3).trim();
      }
    } else {
      if (currentTurn) {
        currentTurn.cantonese += " " + trimmed;
      }
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

/**
 * Parses a raw example block string into Cantonese and English parts.
 *
 * @param content The raw string from the markdown file.
 * @returns Object with cantoneseRaw and translationRaw.
 */
export function parseExampleBlock(content: string): {
  cantoneseRaw: string;
  translationRaw: string;
} {
  const parts = content.split("===");
  return {
    cantoneseRaw: parts[0] ? parts[0].trim() : "",
    translationRaw: parts[1] ? parts[1].trim() : "",
  };
}

export interface ParsedExercise {
  questionHtml: string;
  answerHtml: string;
  explanationHtml: string;
}

export interface RawExercise {
  question?: string;
  answer?: string;
  explanation?: string;
}

/**
 * Parses an exercise block string and compiles it to HTML.
 * @param content The raw YAML string from the markdown block.
 * @param parseYAML A dependency-injected function to parse the YAML string.
 */
export function parseExerciseBlock(
  content: string,
  parseYAML: (str: string) => Record<string, unknown>,
): ParsedExercise {
  const exercise = parseYAML(content) as unknown as RawExercise;
  // Imperative UI manipulation pushed into the functional core
  const displayQuestion = (exercise.question || "").replace(/_{2,}/g, "____");

  return {
    questionHtml: compileMarkdown(displayQuestion, { breaks: true }),
    answerHtml: compileMarkdown(exercise.answer || "", { inline: true }),
    explanationHtml: compileMarkdown(exercise.explanation || ""),
  };
}
