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
  exercises: new Map(), // relativePath -> { type, fullPath }
};

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

      // Cross-reference checks
      data.pages.forEach((page, index) => {
        const pagePath = `pages[${index}]`;

        // Check Exercise References
        if (page.type === "reading" || page.type === "unscramble") {
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
          } else if (exercise.type !== page.type) {
            errors.push(
              `[Data] ${meta.filePath}: ${pagePath} type ("${page.type}") does not match exercise type ("${exercise.type}") in ${expectedRelPath}`,
            );
          }
        }

        // Check Next Lesson References
        if (page.type === "congratulations" && page.nextLessonId) {
          if (!Registry.lessons.has(page.nextLessonId)) {
            errors.push(
              `[Data] ${meta.filePath}: ${pagePath} references non-existent nextLessonId: "${page.nextLessonId}"`,
            );
          }
        }
      });
    } catch (e) {
      errors.push(`[Data] ${meta.filePath}: Failed to parse JSON: ${e.message}`);
    }
  });
}

/**
 * Step 4: Validate all exercise files structurally (already registered)
 */
function validateExerciseDetails() {
  Registry.exercises.forEach((meta, relPath) => {
    try {
      const data = JSON.parse(fs.readFileSync(meta.fullPath, "utf-8"));
      let errs = [];
      if (data.type === "reading") {
        errs = validateObject(data, Schemas.readingExercise);
      } else if (data.type === "unscramble") {
        errs = validateObject(data, Schemas.unscrambleExercise);
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

console.info("🔍 Verifying Data Compliance (Strict Mode)...");
registerExercises();
registerLessonsManifest();
validateLessonDetails();
validateExerciseDetails();

if (errors.length > 0) {
  console.error("\n❌ Data compliance check failed:\n");
  const uniqueErrors = [...new Set(errors)];
  uniqueErrors.forEach((err) => console.error(err));
  process.exit(1);
} else {
  console.info("\n✅ Data adheres to project standards (All cross-references valid).\n");
  process.exit(0);
}
