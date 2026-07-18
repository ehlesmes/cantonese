import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as parser from "./lib/parser.js";
import type { DictionaryEntry } from "./lib/register-utils.js";
import type { SemanticUnit } from "../src/types/index.js";

interface VocabTrackingItem {
  character: string;
  jyutping: string;
  translation: string;
  hash: string;
  firstIntroducedIn: string;
  occurrences: number;
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const contentDir = path.join(projectRoot, "content");
  const jsonPath = path.join(contentDir, "vocabulary.json");
  const mdPath = path.join(contentDir, "vocabulary.md");

  if (!fs.existsSync(contentDir)) {
    console.error(`ERROR: Content directory not found at "${contentDir}"`);
    process.exit(1);
  }

  const curriculumPath = path.join(contentDir, "curriculum.md");
  let chapters: { file: string; id: string }[] = [];
  try {
    chapters = parser.parseCurriculum(curriculumPath);
  } catch (err: unknown) {
    console.error(
      `ERROR: Failed to parse curriculum.md: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // 1.5 Load Master Dictionary for Tone Sandhi Resolution
  const dictPath = path.join(contentDir, "dictionary.json");
  let dictionary: DictionaryEntry[] = [];
  try {
    dictionary = JSON.parse(
      fs.readFileSync(dictPath, "utf8"),
    ) as DictionaryEntry[];
  } catch (err: unknown) {
    console.error(
      `ERROR: Failed to parse dictionary.json: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  const vocabMap: Record<string, VocabTrackingItem> = {};

  // 2. Parse every chapter in chronological order
  for (const chapter of chapters) {
    const filePath = path.join(contentDir, chapter.file);
    if (!fs.existsSync(filePath)) continue;

    let chapterData;
    try {
      chapterData = parser.parseChapter(filePath);
    } catch (err: unknown) {
      console.error(
        `ERROR: Failed to parse "${chapter.file}": ${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }

    for (const block of chapterData.blocks) {
      let units: SemanticUnit[] = [];

      if (block.type === "prose") {
        units = parser.extractInlineUnits(block.content);
      } else if (block.type === "cantonese" || block.type === "dialog") {
        units = parser.extractBlockUnits(block.content);
      } else if (block.type === "exercise") {
        let exerciseData;
        try {
          exerciseData = parser.parseYAML(block.content);
        } catch {
          continue; // Bad exercise block, validation script catches this
        }
        const fields = ["question", "answer", "explanation"];
        for (const field of fields) {
          if (exerciseData[field]) {
            units.push(
              ...parser.extractBlockUnits(String(exerciseData[field])),
            );
          }
        }
      }

      // Add to vocabulary tracking map
      for (const unit of units) {
        const char = unit.characters.trim();
        const jyutping = unit.jyutping.trim().toLowerCase();
        let translation = "";
        if (Array.isArray(unit.translation)) {
          translation = unit.translation.join(" / ");
        } else if (typeof unit.translation === "string") {
          translation = unit.translation;
        }

        // Resolve Primary Jyutping for Tone Sandhi
        let primaryJyutping = jyutping;
        const dictMatch = dictionary.find(
          (entry) =>
            entry.char === char &&
            (entry.jyutping.toLowerCase() === jyutping ||
              entry.alt_jyutping?.some(
                (alt) => alt.toLowerCase() === jyutping,
              )),
        );
        if (dictMatch) {
          primaryJyutping = dictMatch.jyutping.toLowerCase();
        }

        // Unique compound key is character + primary Jyutping to handle homographs & polyphones cleanly
        const key = `${char}_${primaryJyutping}`;

        if (!vocabMap[key]) {
          vocabMap[key] = {
            character: char,
            jyutping: primaryJyutping,
            translation: translation,
            hash: crypto
              .createHash("sha256")
              .update(char)
              .digest("hex")
              .slice(0, 16),
            firstIntroducedIn:
              typeof chapterData.frontmatter?.id === "string"
                ? chapterData.frontmatter.id
                : chapter.id,
            occurrences: 1,
          };
        } else {
          vocabMap[key].occurrences++;

          // Merge translations cleanly if they represent different nuances
          const existingTrans = vocabMap[key].translation;
          const existingParts = existingTrans
            .split("/")
            .map((s: string) => s.trim());
          const newParts: string[] = translation
            .split("/")
            .map((s: string) => s.trim());

          const merged = [...existingParts];
          for (const np of newParts) {
            const lowerNp = np.toLowerCase();
            if (!merged.some((ep) => ep.toLowerCase() === lowerNp)) {
              merged.push(np);
            }
          }
          vocabMap[key].translation = merged.join(" / ");
        }
      }
    }
  }

  // 3. Sort vocabulary alphabetically by Jyutping, then by Character
  const sortedVocab = Object.values(vocabMap).sort((a, b) => {
    const jpCompare = a.jyutping.localeCompare(b.jyutping);
    if (jpCompare !== 0) return jpCompare;
    return a.character.localeCompare(b.character);
  });

  // 4. Output vocabulary.json
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(sortedVocab, null, 2), "utf8");
    console.log(
      `✓ Generated structured database: content/vocabulary.json (${sortedVocab.length} entries)`,
    );
  } catch (err: unknown) {
    console.error(
      `ERROR: Failed to write vocabulary.json: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // 5. Output vocabulary.md (human-readable glossary table)
  let mdContent = `# Colloquial Cantonese Course: Vocabulary Glossary

This is an automatically generated vocabulary database compiled from all course chapters. It tracks the characters, Jyutping, English translation, the chapter where the term was first introduced, and the total occurrence count.

| Character | Jyutping | Translation | First Introduced In | Occurrences |
| :--- | :--- | :--- | :--- | :--- |
`;

  for (const item of sortedVocab) {
    mdContent += `| **${item.character}** | \`${item.jyutping}\` | ${item.translation} | \`${item.firstIntroducedIn}\` | ${item.occurrences} |\n`;
  }

  try {
    fs.writeFileSync(mdPath, mdContent, "utf8");
    console.log(`✓ Generated human glossary: content/vocabulary.md`);
  } catch (err: unknown) {
    console.error(
      `ERROR: Failed to write vocabulary.md: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {};
