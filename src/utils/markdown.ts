import { marked } from "marked";
import { RawExerciseSchema } from "./schemas.js";
import { z } from "zod";
import { getAudioHash } from "./audio.js";
import type { CompileMarkdownOptions } from "../types";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: false,
});

async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (match: string, ...args: string[]) => Promise<string>,
) {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match: string, ...args: unknown[]) => {
    promises.push(asyncFn(match, ...(args.slice(0, -2) as string[])));
    return match;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift()!);
}

/**
 * Compiles a raw annotated markdown string (prose) into HTML with tooltips.
 * Converts inline `Char[Jyutping|Translation]` (with backticks) to tooltips.
 *
 * @param text
 * @param [options={}] Options object (e.g. { inline: true })
 * @returns Compiled HTML
 */
export async function compileMarkdown(
  text: string | null | undefined,
  options: CompileMarkdownOptions = {},
): Promise<string> {
  if (!text) return "";

  // Regex to match: `Char[Jyutping|Translation]` (with backticks)
  const inlineRegex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  const replacer = async (
    _match: string,
    char: string,
    jyutping: string,
    translation: string,
  ) => {
    const hash = await getAudioHash(char);
    return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
  };

  let processedText = await replaceAsync(text, inlineRegex, replacer);
  processedText = await replaceAsync(processedText, blockRegex, replacer);

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
export async function compileAnnotations(
  text: string | null | undefined,
): Promise<string> {
  if (!text) return "";

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  return await replaceAsync(
    text,
    blockRegex,
    async (
      _match: string,
      char: string,
      jyutping: string,
      translation: string,
    ) => {
      const hash = await getAudioHash(char);
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

export type RawExercise = z.infer<typeof RawExerciseSchema>;

/**
 * Parses an exercise block string and compiles it to HTML.
 * @param content The raw YAML string from the markdown block.
 * @param parseYAML A dependency-injected function to parse the YAML string.
 */
export async function parseExerciseBlock(
  content: string,
  parseYAML: (str: string) => Record<string, unknown>,
): Promise<ParsedExercise> {
  let exercise: RawExercise = {};
  try {
    exercise = RawExerciseSchema.parse(parseYAML(content));
  } catch {
    return { questionHtml: "", answerHtml: "", explanationHtml: "" };
  }
  // Imperative UI manipulation pushed into the functional core
  const displayQuestion = (exercise.question || "").replace(/_{2,}/g, "____");

  return {
    questionHtml: await compileMarkdown(displayQuestion, { breaks: true }),
    answerHtml: await compileMarkdown(exercise.answer || "", { inline: true }),
    explanationHtml: await compileMarkdown(exercise.explanation || ""),
  };
}
