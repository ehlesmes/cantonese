import * as crypto from "crypto";
import * as parser from "./parser.js";
import type { DictionaryEntry } from "./register-utils.js";
import type { SemanticUnit, RawParsedChapter } from "../../src/types/index.js";

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
  for (const np of newParts) {
    const lowerNp = np.toLowerCase();
    if (!merged.some((ep) => ep.toLowerCase() === lowerNp)) {
      merged.push(np);
    }
  }
  return merged.join(" / ");
}

export function generateHash(char: string): string {
  return crypto.createHash("sha256").update(char).digest("hex").slice(0, 16);
}

export function compileVocabularyMap(
  chapters: ChapterInput[],
  dictionary: DictionaryEntry[],
): VocabTrackingItem[] {
  const vocabMap: Record<string, VocabTrackingItem> = {};

  for (const chapter of chapters) {
    for (const block of chapter.chapterData.blocks) {
      let units: SemanticUnit[] = [];

      if (block.type === "prose") {
        units = parser.extractInlineUnits(block.content);
      } else if (block.type === "cantonese" || block.type === "dialog") {
        units = parser.extractBlockUnits(block.content);
      } else if (block.type === "exercise") {
        let exerciseData: Record<string, unknown> | null = null;
        try {
          exerciseData = parser.parseYAML(block.content) as Record<
            string,
            unknown
          >;
        } catch {
          continue;
        }
        const fields = ["question", "answer", "explanation"];
        for (const field of fields) {
          if (exerciseData && exerciseData[field]) {
            units.push(
              ...parser.extractBlockUnits(String(exerciseData[field])),
            );
          }
        }
      }

      for (const unit of units) {
        const char = unit.characters.trim();
        const jyutping = unit.jyutping.trim().toLowerCase();
        const translation = unit.translation;

        const primaryJyutping = resolvePrimaryJyutping(
          char,
          jyutping,
          dictionary,
        );
        const key = `${char}_${primaryJyutping}`;

        if (!vocabMap[key]) {
          vocabMap[key] = {
            character: char,
            jyutping: primaryJyutping,
            translation: translation,
            hash: generateHash(char),
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
