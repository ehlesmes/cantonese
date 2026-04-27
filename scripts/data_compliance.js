import fs from "fs";
import path from "path";

const DATA_DIR = "./data";
const errors = [];

/**
 * Utility to report validation errors with clear context.
 */
function reportError(file, message) {
  errors.push(`[Data] ${file}: ${message}`);
}

/**
 * Type checkers
 */
const isString = (val) => typeof val === "string";
const isArray = (val) => Array.isArray(val);
const isType = (types) => (val) => types.includes(val);

/**
 * Validates an object against a schema.
 * Supports:
 * - "required": field must exist.
 * - Function: custom validation logic.
 * - Object: nested validation.
 * - [Object]: array of objects validation.
 */
function validateObject(obj, schema, filePath, prefix = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    reportError(
      filePath,
      `${prefix || "Root"} expected object, got ${typeof obj}`,
    );
    return;
  }

  // Check required fields and custom rules
  for (const key in schema) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const rule = schema[key];
    const value = obj[key];

    if (rule === "required") {
      if (value === undefined) {
        reportError(filePath, `Missing required field "${fieldPath}"`);
      }
    } else if (typeof rule === "function") {
      if (!rule(value, obj)) {
        reportError(
          filePath,
          `Invalid or missing value for "${fieldPath}": ${JSON.stringify(value)}`,
        );
      }
    } else if (isArray(rule)) {
      if (!isArray(value)) {
        reportError(filePath, `"${fieldPath}" must be an array`);
      } else {
        const itemSchema = rule[0];
        value.forEach((item, index) => {
          const itemPath = `${fieldPath}[${index}]`;
          if (typeof itemSchema === "object") {
            validateObject(item, itemSchema, filePath, itemPath);
          } else if (typeof itemSchema === "function") {
            if (!itemSchema(item)) {
              reportError(filePath, `Invalid value at "${itemPath}"`);
            }
          }
        });
      }
    } else if (typeof rule === "object") {
      if (value === undefined) {
        reportError(filePath, `Missing required object "${fieldPath}"`);
      } else {
        validateObject(value, rule, filePath, fieldPath);
      }
    }
  }

  // Check for unknown keys
  for (const key in obj) {
    if (!(key in schema)) {
      reportError(
        filePath,
        `Unknown field "${prefix ? `${prefix}.${key}` : key}"`,
      );
    }
  }
}

/**
 * Schemas
 */
const lessonsJsonSchema = {
  chapters: [
    {
      chapterId: isString,
      chapterName: isString,
      lessons: [
        {
          lessonId: isString,
          lessonName: isString,
        },
      ],
    },
  ],
};

const pageBaseSchema = {
  pageId: isString,
  type: isType(["explanation", "reading", "unscramble", "congratulations"]),
};

const congratulationsPageSchema = {
  ...pageBaseSchema,
  title: isString,
  summary: isString,
  nextLessonId: (val) => val === null || isString(val),
};

const explanationContentSchema = {
  type: isType(["title", "text", "example"]),
  value: (val, obj) => {
    if (obj && obj.type === "example") return val === undefined;
    return isString(val);
  },
  cantonese: (val, obj) =>
    obj && obj.type === "example" ? isString(val) : val === undefined,
  romanization: (val, obj) =>
    obj && obj.type === "example" ? isString(val) : val === undefined,
  translation: (val, obj) =>
    obj && obj.type === "example" ? isString(val) : val === undefined,
};

const readingExerciseSchema = {
  type: (val) => val === "reading",
  cantonese: isString,
  romanization: isString,
  translation: isString,
};

const unscrambleExerciseSchema = {
  type: (val) => val === "unscramble",
  tokens: (val) =>
    isArray(val) &&
    val.every((t) => isArray(t) && t.length === 2 && t.every(isString)),
  translation: isString,
};

/**
 * Validation Tasks
 */
function validateLessonsJson() {
  const filePath = path.join(DATA_DIR, "lessons.json");
  if (!fs.existsSync(filePath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    validateObject(data, lessonsJsonSchema, filePath);
  } catch (e) {
    reportError(filePath, `Failed to parse JSON: ${e.message}`);
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
        if (!isArray(data)) {
          reportError(filePath, "Root must be an array of pages");
          return;
        }
        data.forEach((page, index) => {
          const prefix = `[${index}]`;
          if (page.type === "explanation") {
            validateObject(
              page,
              { ...pageBaseSchema, content: [explanationContentSchema] },
              filePath,
              prefix,
            );
          } else if (page.type === "congratulations") {
            validateObject(page, congratulationsPageSchema, filePath, prefix);
          } else {
            validateObject(page, pageBaseSchema, filePath, prefix);
          }
        });
      } catch (e) {
        reportError(filePath, `Failed to parse JSON: ${e.message}`);
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
          if (data.type === "reading") {
            validateObject(data, readingExerciseSchema, fullPath);
          } else if (data.type === "unscramble") {
            validateObject(data, unscrambleExerciseSchema, fullPath);
          } else {
            reportError(fullPath, `Unknown exercise type: ${data.type}`);
          }
        } catch (e) {
          reportError(fullPath, `Failed to parse JSON: ${e.message}`);
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
  errors.forEach((err) => console.error(err));
  process.exit(1);
} else {
  console.info("\n✅ Data adheres to project standards.\n");
  process.exit(0);
}
