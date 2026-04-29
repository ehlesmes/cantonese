import fs from "fs";
import path from "path";
import { validateObject } from "../schemas/validator.js";
import { Schemas } from "../schemas/lessons.js";

const DATA_DIR = "./data";
const errors = [];

/**
 * Utility to report validation errors with clear context.
 */
function report(filePath, errorList) {
  errorList.forEach((err) => errors.push(`[Data] ${filePath}: ${err}`));
}

// Registry of all available data
const Registry = {
  lessons: new Map(), // lessonId -> { chapterId, filePath, exists: boolean }
  exercises: new Map(), // relativePath -> { type, fullPath, content: Object, referenced: boolean }
  allLessonIds: [], // lessonId in order of appearance in manifest
  lessonFilesOnDisk: new Set(), // Full paths of all .json files in data/lessons/
};

/**
 * Step 0: Scan for all potential data files on disk
 */
function scanDisk() {
  const lessonsDir = path.join(DATA_DIR, "lessons");
  if (fs.existsSync(lessonsDir)) {
    const walk = (dir) => {
      fs.readdirSync(dir).forEach((item) => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith(".json")) {
          Registry.lessonFilesOnDisk.add(path.resolve(fullPath));
        }
      });
    };
    walk(lessonsDir);
  }
}

/**
 * Step 1: Scan and register all available exercises
 */
function registerExercises() {
  const exercisesDir = path.join(DATA_DIR, "exercises");
  if (!fs.existsSync(exercisesDir)) return;

  function walk(dir) {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith(".json")) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          const relPath = path.relative(exercisesDir, fullPath);
          Registry.exercises.set(relPath, {
            type: content.type,
            fullPath,
            content,
            referenced: false,
          });
        } catch (e) {
          errors.push(`[Data] ${fullPath}: Failed to parse JSON: ${e.message}`);
        }
      }
    });
  }
  walk(exercisesDir);
}

/**
 * Step 2: Scan lessons.json and register expected lesson files
 */
function registerLessonsManifest() {
  const filePath = path.join(DATA_DIR, "lessons.json");
  if (!fs.existsSync(filePath)) {
    errors.push(`[Data] Missing manifest: ${filePath}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const errs = validateObject(data, Schemas.lessonsJson);
    report(filePath, errs);

    data.chapters.forEach((chapter) => {
      chapter.lessons.forEach((lesson) => {
        if (Registry.lessons.has(lesson.lessonId)) {
          errors.push(
            `[Data] ${filePath}: Duplicate lessonId found: "${lesson.lessonId}"`,
          );
        }
        Registry.allLessonIds.push(lesson.lessonId);
        const lessonFilePath = path.join(
          DATA_DIR,
          "lessons",
          chapter.chapterId,
          `${lesson.lessonId}.json`,
        );
        Registry.lessons.set(lesson.lessonId, {
          chapterId: chapter.chapterId,
          filePath: lessonFilePath,
          exists: fs.existsSync(lessonFilePath),
        });

        if (!Registry.lessons.get(lesson.lessonId).exists) {
          errors.push(
            `[Data] Lesson "${lesson.lessonId}" listed in manifest but file missing at: ${lessonFilePath}`,
          );
        }
      });
    });
  } catch (e) {
    errors.push(`[Data] ${filePath}: Failed to parse JSON: ${e.message}`);
  }
}

const PUNCTUATION_REGEX = /[\s，。！？、,.:;?!'"]/g;
const CJK_REGEX = /[\u4E00-\u9FFF]/g;
const SYLLABLE_REGEX = /^[a-z]+[1-6][，。！？、,.:;?!'"]*$/;

/**
 * Validates a Cantonese/Romanization/Translation triplet.
 * Used for both exercises and explanation examples.
 */
function validateCantoneseTriplet(
  cantonese,
  romanization,
  translation,
  context,
) {
  const errs = [];

  // Basic presence
  if (!cantonese || cantonese.trim().length === 0) {
    errs.push(`${context}: Cantonese text is missing or empty.`);
  }
  if (!romanization || romanization.trim().length === 0) {
    errs.push(`${context}: Romanization is missing or empty.`);
  }
  if (!translation || translation.trim().length === 0) {
    errs.push(`${context}: Translation is missing or empty.`);
  }

  if (errs.length > 0) return errs;

  const cleanCantonese = cantonese.replace(PUNCTUATION_REGEX, "");
  const cjkChars = cantonese.match(CJK_REGEX) || [];
  const syllables = romanization.trim().split(/\s+/);

  // Check if it's just punctuation
  if (cleanCantonese.length === 0) {
    errs.push(
      `${context}: Cantonese text contains no characters (only punctuation/whitespace).`,
    );
  }

  // Syllable format check
  syllables.forEach((s, i) => {
    if (!SYLLABLE_REGEX.test(s)) {
      errs.push(
        `${context}: Invalid romanization syllable at index ${i}: "${s}". Must be [a-z]+[1-6].`,
      );
    }
  });

  // 1:1 Sync check for CJK characters
  // If the text is pure CJK (no Latin), we can be very strict about 1:1.
  const hasLatin = /[a-zA-Z]/.test(cleanCantonese);
  if (!hasLatin && cjkChars.length !== syllables.length) {
    errs.push(
      `${context}: Romanization sync error. Cantonese has ${cjkChars.length} characters, but romanization has ${syllables.length} syllables.`,
    );
  }

  return errs;
}

/**
 * Step 3: Validate individual lesson files and their cross-references
 */
function validateLessonDetails() {
  Registry.lessons.forEach((meta, lessonId) => {
    if (!meta.exists) return;

    try {
      const data = JSON.parse(fs.readFileSync(meta.filePath, "utf-8"));
      const errs = validateObject(data, Schemas.lessonDetail);
      report(meta.filePath, errs);

      // Pedagogical and Cross-reference checks
      let explanationCount = 0;
      let readingCount = 0;
      let unscrambleCount = 0;
      const explanationChars = new Set();
      const exerciseChars = new Set();

      data.pages.forEach((page, index) => {
        const pagePath = `pages[${index}]`;

        if (page.type === "explanation") {
          explanationCount++;
          page.content.forEach((item, itemIdx) => {
            if (item.type === "example") {
              const context = `${pagePath}.content[${itemIdx}]`;
              const tripletErrs = validateCantoneseTriplet(
                item.cantonese,
                item.romanization,
                item.translation,
                context,
              );
              report(meta.filePath, tripletErrs);

              if (item.cantonese) {
                [...item.cantonese].forEach((c) => explanationChars.add(c));
              }
            }
          });
        }

        if (page.type === "dialog") {
          page.lines.forEach((line, lineIdx) => {
            const context = `${pagePath}.lines[${lineIdx}]`;
            const tripletErrs = validateCantoneseTriplet(
              line.cantonese,
              line.romanization,
              line.translation,
              context,
            );
            report(meta.filePath, tripletErrs);
          });
        }

        // Check Exercise References
        if (page.type === "reading" || page.type === "unscramble") {
          if (page.type === "reading") readingCount++;
          if (page.type === "unscramble") unscrambleCount++;

          const lessonPart = lessonId.split(".")[1];
          const expectedRelPath = path.join(
            meta.chapterId,
            lessonPart,
            `${page.exerciseId}.json`,
          );

          const exercise = Registry.exercises.get(expectedRelPath);
          if (!exercise) {
            errors.push(
              `[Data] ${meta.filePath}: ${pagePath} references non-existent exercise: ${expectedRelPath}`,
            );
          } else {
            exercise.referenced = true;
            if (exercise.type !== page.type) {
              errors.push(
                `[Data] ${meta.filePath}: ${pagePath} type ("${page.type}") does not match exercise type ("${exercise.type}") in ${expectedRelPath}`,
              );
            }
            // Collect characters from exercise content (using cached registry data)
            const exData = exercise.content;
            if (exData.cantonese) {
              [...exData.cantonese].forEach((c) => exerciseChars.add(c));
            }
            if (exData.tokens) {
              exData.tokens.forEach(([char]) =>
                [...char].forEach((c) => exerciseChars.add(c)),
              );
            }
          }
        }

        // Check Next Lesson References
        if (page.type === "congratulations") {
          const currentIndex = Registry.allLessonIds.indexOf(lessonId);
          const expectedNextId =
            Registry.allLessonIds[currentIndex + 1] || null;

          if (page.nextLessonId !== expectedNextId) {
            errors.push(
              `[Data] ${meta.filePath}: ${pagePath} has incorrect nextLessonId. Expected "${expectedNextId}", found "${page.nextLessonId}"`,
            );
          }
        }
      });

      // Report pedagogical failures
      if (readingCount < explanationCount) {
        errors.push(
          `[Pedagogy] ${meta.filePath}: Not enough reading exercises. Found ${readingCount}, expected at least ${explanationCount} (one per explanation page).`,
        );
      }
      if (unscrambleCount < explanationCount) {
        errors.push(
          `[Pedagogy] ${meta.filePath}: Not enough unscramble exercises. Found ${unscrambleCount}, expected at least ${explanationCount} (one per explanation page).`,
        );
      }

      const missingChars = [...explanationChars].filter(
        (c) => !exerciseChars.has(c) && !/[\s，。！？、,.:;?!'"]/.test(c),
      );
      if (missingChars.length > 0) {
        errors.push(
          `[Pedagogy] ${meta.filePath}: Characters introduced in explanations but never tested in exercises: ${missingChars.join(", ")}`,
        );
      }
    } catch (e) {
      errors.push(
        `[Data] ${meta.filePath}: Failed to parse JSON: ${e.message}`,
      );
    }
  });
}

/**
 * Step 4: Validate all exercise files structurally (already registered)
 */
function validateExerciseDetails() {
  Registry.exercises.forEach((meta) => {
    try {
      const data = JSON.parse(fs.readFileSync(meta.fullPath, "utf-8"));
      let errs = [];
      if (data.type === "reading") {
        errs = [
          ...validateObject(data, Schemas.readingExercise),
          ...validateCantoneseTriplet(
            data.cantonese,
            data.romanization,
            data.translation,
            "Reading Exercise",
          ),
        ];
      } else if (data.type === "unscramble") {
        errs = validateObject(data, Schemas.unscrambleExercise);

        if (data.tokens) {
          if (data.tokens.length < 2) {
            errs.push("Unscramble exercise must have at least two tokens.");
          }

          data.tokens.forEach(([char, rom], i) => {
            const context = `Token ${i} ("${char}")`;
            const cleanChar = char.replace(PUNCTUATION_REGEX, "");
            const cjkChars = char.match(CJK_REGEX) || [];
            const tokenSyllables = rom.trim().split(/\s+/);

            if (cleanChar.length === 0 && char.length > 0) {
              errs.push(
                `${context}: Contains only punctuation. Punctuation should be attached to characters or omitted from tokens.`,
              );
            }
            if (char.trim().length === 0) {
              errs.push(`${context}: Empty Cantonese text.`);
            }

            tokenSyllables.forEach((s) => {
              if (!SYLLABLE_REGEX.test(s)) {
                errs.push(`${context}: Invalid romanization syllable "${s}".`);
              }
            });

            // 1:1 check within token for CJK
            const hasLatin = /[a-zA-Z]/.test(cleanChar);
            if (
              !hasLatin &&
              cjkChars.length !== tokenSyllables.length &&
              cjkChars.length > 0
            ) {
              errs.push(
                `${context}: Sync error. ${cjkChars.length} chars vs ${tokenSyllables.length} syllables.`,
              );
            }
          });
        }

        if (!data.translation || data.translation.trim().length === 0) {
          errs.push("Translation must not be empty.");
        }
      } else {
        errs.push(`Unknown exercise type: ${data.type}`);
      }
      report(meta.fullPath, errs);
    } catch (e) {
      errors.push(
        `[Data] ${meta.fullPath}: Failed to parse JSON: ${e.message}`,
      );
    }
  });
}

/**
 * Step 5: Final orphaned files check
 */
function reportOrphans() {
  // Orphaned Exercises
  Registry.exercises.forEach((meta, relPath) => {
    if (!meta.referenced) {
      errors.push(`[Data] Orphaned exercise file: data/exercises/${relPath}`);
    }
  });

  // Orphaned Lessons
  const registeredLessonFiles = new Set(
    [...Registry.lessons.values()].map((m) => path.resolve(m.filePath)),
  );
  Registry.lessonFilesOnDisk.forEach((fullPath) => {
    if (!registeredLessonFiles.has(fullPath)) {
      errors.push(
        `[Data] Orphaned lesson file: ${path.relative(process.cwd(), fullPath)}`,
      );
    }
  });
}

console.info("🔍 Verifying Data Compliance (Strict Mode)...");
scanDisk();
registerExercises();
registerLessonsManifest();
validateLessonDetails();
validateExerciseDetails();
reportOrphans();

if (errors.length > 0) {
  console.error("\n❌ Data compliance check failed:\n");
  const uniqueErrors = [...new Set(errors)];
  uniqueErrors.forEach((err) => console.error(err));
  process.exit(1);
} else {
  console.info(
    "\n✅ Data adheres to project standards (All cross-references valid).\n",
  );
  process.exit(0);
}
