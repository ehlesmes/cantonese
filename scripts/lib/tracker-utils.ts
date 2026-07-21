import * as parser from "./parser.js";
import { getAudioHash } from "../../src/utils/audio.js";
import type { DictionaryEntry } from "./register-utils.js";
import type {
  SemanticUnit,
  RawParsedChapter,
  ParsedBlock,
} from "../../src/types/index.js";

export interface VocabTrackingItem {
  character: string;
  jyutping: string;
  translation: string;
  hash: string;
  firstIntroducedIn: string;
  occurrences: number;
}

export interface ChapterInput {
  curriculumId: string;
  chapterData: RawParsedChapter;
}

export function resolvePrimaryJyutping(
  char: string,
  jyutping: string,
  dictionary: DictionaryEntry[],
): string {
  let primaryJyutping = jyutping.toLowerCase();
  const dictMatch = dictionary.find(
    (entry) =>
      entry.char === char &&
      (entry.jyutping.toLowerCase() === primaryJyutping ||
        entry.alt_jyutping?.some(
          (alt) => alt.toLowerCase() === primaryJyutping,
        )),
  );
  if (dictMatch) {
    primaryJyutping = dictMatch.jyutping.toLowerCase();
  }
  return primaryJyutping;
}

export function mergeTranslations(
  existingTrans: string,
  newTrans: string,
): string {
  const existingParts = existingTrans.split("/").map((s) => s.trim());
  const newParts = newTrans.split("/").map((s) => s.trim());
  const merged = [...existingParts];

  const getCore = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/\s*[([].*?[)\]]\s*/g, " ") // remove parentheses
      .replace(/^to\s+/, "") // remove leading "to "
      .replace(/[^\w\s]/g, "") // remove punctuation
      .replace(/\s+/g, " ")
      .trim();

  for (const np of newParts) {
    const coreNp = getCore(np);
    if (!coreNp) continue;

    let handled = false;
    for (let i = 0; i < merged.length; i++) {
      const ep = merged[i]!;
      const coreEp = getCore(ep);
      if (!coreEp) continue;

      if (coreEp === coreNp) {
        if (np.length > ep.length) {
          merged[i] = np;
        }
        handled = true;
        break;
      }

      const regexNp = new RegExp(`\\b${coreNp}\\b`, "i");
      const regexEp = new RegExp(`\\b${coreEp}\\b`, "i");

      if (regexNp.test(coreEp)) {
        handled = true;
        break;
      } else if (regexEp.test(coreNp)) {
        merged[i] = np;
        handled = true;
        break;
      }
    }

    if (!handled) {
      merged.push(np);
    }
  }
  return merged.join(" / ");
}

export async function generateHash(char: string): Promise<string> {
  return await getAudioHash(char);
}

function extractUnitsFromBlock(block: ParsedBlock): SemanticUnit[] {
  let units: SemanticUnit[] = [];

  if (block.type === "prose") {
    units = parser.extractInlineUnits(block.content);
  } else if (block.type === "cantonese" || block.type === "dialog") {
    units = parser.extractBlockUnits(block.content);
  } else if (block.type === "exercise") {
    let exerciseData: Record<string, unknown> | null = null;
    try {
      exerciseData = parser.parseYAML(block.content);
    } catch {
      return units;
    }
    const fields = ["question", "answer", "explanation"];
    for (const field of fields) {
      if (exerciseData && exerciseData[field]) {
        units.push(...parser.extractBlockUnits(String(exerciseData[field])));
      }
    }
  }

  return units;
}

async function updateVocabMap(
  vocabMap: Record<string, VocabTrackingItem>,
  unit: SemanticUnit,
  chapter: ChapterInput,
  dictionary: DictionaryEntry[],
): Promise<void> {
  const char = unit.characters.trim();
  const jyutping = unit.jyutping.trim().toLowerCase();
  const translation = unit.translation;

  const primaryJyutping = resolvePrimaryJyutping(char, jyutping, dictionary);
  const key = `${char}_${primaryJyutping}`;

  if (!vocabMap[key]) {
    vocabMap[key] = {
      character: char,
      jyutping: primaryJyutping,
      translation: translation,
      hash: await generateHash(char),
      firstIntroducedIn:
        typeof chapter.chapterData.frontmatter?.id === "string"
          ? chapter.chapterData.frontmatter.id
          : chapter.curriculumId,
      occurrences: 1,
    };
  } else {
    vocabMap[key].occurrences++;
    vocabMap[key].translation = mergeTranslations(
      vocabMap[key].translation,
      translation,
    );
  }
}

export async function compileVocabularyMap(
  chapters: ChapterInput[],
  dictionary: DictionaryEntry[],
): Promise<VocabTrackingItem[]> {
  const vocabMap: Record<string, VocabTrackingItem> = {};

  for (const chapter of chapters) {
    for (const block of chapter.chapterData.blocks) {
      const units = extractUnitsFromBlock(block);

      for (const unit of units) {
        await updateVocabMap(vocabMap, unit, chapter, dictionary);
      }
    }
  }

  return Object.values(vocabMap).sort((a, b) => {
    const jpCompare = a.jyutping.localeCompare(b.jyutping);
    if (jpCompare !== 0) return jpCompare;
    return a.character.localeCompare(b.character);
  });
}

export function generateVocabularyMarkdown(
  sortedVocab: VocabTrackingItem[],
): string {
  let mdContent = `# Colloquial Cantonese Course: Vocabulary Glossary\n\n`;
  mdContent += `This is an automatically generated vocabulary database compiled from all course chapters. It tracks the characters, Jyutping, English translation, the chapter where the term was first introduced, and the total occurrence count.\n\n`;
  mdContent += `| Character | Jyutping | Translation | First Introduced In | Occurrences |\n`;
  mdContent += `| :--- | :--- | :--- | :--- | :--- |\n`;

  for (const item of sortedVocab) {
    mdContent += `| **${item.character}** | \`${item.jyutping}\` | ${item.translation} | \`${item.firstIntroducedIn}\` | ${item.occurrences} |\n`;
  }
  return mdContent;
}
