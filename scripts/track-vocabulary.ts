import * as fs from "fs";
import * as path from "path";
import * as parser from "./lib/parser.js";
import type { DictionaryEntry } from "./lib/register-utils.js";
import {
  compileVocabularyMap,
  generateVocabularyMarkdown,
  type ChapterInput,
} from "./lib/tracker-utils.js";

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

  // 1. Load chapters
  const parsedChapters: ChapterInput[] = [];
  for (const chapter of chapters) {
    const filePath = path.join(contentDir, chapter.file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const chapterData = parser.parseChapter(filePath);
      parsedChapters.push({
        curriculumId: chapter.id,
        chapterData,
      });
    } catch (err: unknown) {
      console.error(
        `ERROR: Failed to parse "${chapter.file}": ${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }
  }

  // 2. Delegate to Functional Core
  const sortedVocab = compileVocabularyMap(parsedChapters, dictionary);

  // 3. Output vocabulary.json
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

  // 4. Output vocabulary.md
  const mdContent = generateVocabularyMarkdown(sortedVocab);
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
