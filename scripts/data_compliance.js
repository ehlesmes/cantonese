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

/**
 * Validation Tasks
 */
function validateLessonsJson() {
  const filePath = path.join(DATA_DIR, "lessons.json");
  if (!fs.existsSync(filePath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const errs = validateObject(data, Schemas.lessonsJson);
    report(filePath, errs);
  } catch (e) {
    errors.push(`[Data] ${filePath}: Failed to parse JSON: ${e.message}`);
  }
}

function validateLessonFiles() {
  const lessonsDir = path.join(DATA_DIR, "lessons");
  if (!fs.existsSync(lessonsDir)) return;

  const chapters = fs.readdirSync(lessonsDir);
  chapters.forEach((chapter) => {
    const chapterPath = path.join(lessonsDir, chapter);
    if (!fs.statSync(chapterPath).isDirectory()) return;

    const files = fs.readdirSync(chapterPath);
    files.forEach((file) => {
      if (!file.endsWith(".json")) return;
      const filePath = path.join(chapterPath, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const errs = validateObject(data, Schemas.lessonDetail);
        report(filePath, errs);
      } catch (e) {
        errors.push(`[Data] ${filePath}: Failed to parse JSON: ${e.message}`);
      }
    });
  });
}

function validateExerciseFiles() {
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
          const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          let errs = [];
          if (data.type === "reading") {
            errs = validateObject(data, Schemas.readingExercise);
          } else if (data.type === "unscramble") {
            errs = validateObject(data, Schemas.unscrambleExercise);
          } else {
            errs.push(`Unknown exercise type: ${data.type}`);
          }
          report(fullPath, errs);
        } catch (e) {
          errors.push(`[Data] ${fullPath}: Failed to parse JSON: ${e.message}`);
        }
      }
    });
  }
  walk(exercisesDir);
}

console.info("🔍 Verifying Data Compliance...");
validateLessonsJson();
validateLessonFiles();
validateExerciseFiles();

if (errors.length > 0) {
  console.error("\n❌ Data compliance check failed:\n");
  const uniqueErrors = [...new Set(errors)];
  uniqueErrors.forEach((err) => console.error(err));
  process.exit(1);
} else {
  console.info("\n✅ Data adheres to project standards.\n");
  process.exit(0);
}
