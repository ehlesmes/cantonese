const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const parser = require("./lib/parser");

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const contentDir = path.join(projectRoot, "content");
  const jsonPath = path.join(contentDir, "vocabulary.json");
  const mdPath = path.join(contentDir, "vocabulary.md");

  if (!fs.existsSync(contentDir)) {
    console.error(`ERROR: Content directory not found at "${contentDir}"`);
    process.exit(1);
  }

  // 1. Load curriculum chapters
  const curriculumPath = path.join(contentDir, "curriculum.md");
  let chapters = [];
  try {
    chapters = parser.parseCurriculum(curriculumPath);
  } catch (err) {
    console.error(`ERROR: Failed to parse curriculum.md: ${err.message}`);
    process.exit(1);
  }

  const vocabMap = {};

  // 2. Parse every chapter in chronological order
  for (const chapter of chapters) {
    const filePath = path.join(contentDir, chapter.file);
    if (!fs.existsSync(filePath)) continue;

    let chapterData;
    try {
      chapterData = parser.parseChapter(filePath);
    } catch (err) {
      console.error(`ERROR: Failed to parse "${chapter.file}": ${err.message}`);
      continue;
    }

    for (const block of chapterData.blocks) {
      let units = [];

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
        const translation = unit.translation.trim();

        // Unique compound key is character + jyutping to handle homographs & polyphones
        const key = `${char}_${jyutping}`;

        if (!vocabMap[key]) {
          vocabMap[key] = {
            character: char,
            jyutping: jyutping,
            translation: translation,
            hash: crypto
              .createHash("sha256")
              .update(char)
              .digest("hex")
              .slice(0, 16),
            firstIntroducedIn: chapterData.frontmatter.id || chapter.id,
            occurrences: 1,
          };
        } else {
          vocabMap[key].occurrences++;

          // Merge translations cleanly if they represent different nuances
          const existingTrans = vocabMap[key].translation;
          const lowerExisting = existingTrans.toLowerCase();
          const lowerNew = translation.toLowerCase();

          // Append if it's a distinct translation nuance
          if (!lowerExisting.includes(lowerNew)) {
            vocabMap[key].translation = `${existingTrans} / ${translation}`;
          }
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
  } catch (err) {
    console.error(`ERROR: Failed to write vocabulary.json: ${err.message}`);
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
  } catch (err) {
    console.error(`ERROR: Failed to write vocabulary.md: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
