import { Validators, validateObject } from "./validator.js";

const pageBase = {
  pageId: Validators.isString,
  type: Validators.isType([
    "explanation",
    "reading",
    "unscramble",
    "congratulations",
  ]),
};

const explanationContent = {
  type: Validators.isType(["title", "text", "example"]),
  value: (val, obj) => {
    if (obj && obj.type === "example") return val === undefined;
    return Validators.isString(val);
  },
  cantonese: (val, obj) =>
    obj && obj.type === "example"
      ? Validators.isString(val)
      : val === undefined,
  romanization: (val, obj) =>
    obj && obj.type === "example"
      ? Validators.isString(val)
      : val === undefined,
  translation: (val, obj) =>
    obj && obj.type === "example"
      ? Validators.isString(val)
      : val === undefined,
};

const explanationPage = {
  ...pageBase,
  type: (val) => val === "explanation",
  content: [explanationContent],
};

const congratulationsPage = {
  ...pageBase,
  type: (val) => val === "congratulations",
  title: Validators.isString,
  summary: Validators.isString,
  nextLessonId: (val) => val === null || Validators.isString(val),
};

const readingPage = { ...pageBase, type: (val) => val === "reading" };
const unscramblePage = { ...pageBase, type: (val) => val === "unscramble" };

export const Schemas = {
  lessonsJson: {
    version: Validators.isNumber,
    chapters: [
      {
        chapterId: Validators.isString,
        chapterName: Validators.isString,
        lessons: [
          {
            lessonId: Validators.isString,
            lessonName: Validators.isString,
          },
        ],
      },
    ],
  },

  lessonDetail: {
    version: Validators.isNumber,
    pages: [
      (item) => {
        const schemas = {
          explanation: explanationPage,
          reading: readingPage,
          unscramble: unscramblePage,
          congratulations: congratulationsPage,
        };
        const schema = schemas[item.type];
        if (!schema) return [`Unknown page type "${item.type}"`];
        return validateObject(item, schema);
      },
    ],
  },

  readingExercise: {
    version: Validators.isNumber,
    type: (val) => val === "reading",
    cantonese: Validators.isString,
    romanization: Validators.isString,
    translation: Validators.isString,
  },

  unscrambleExercise: {
    version: Validators.isNumber,
    type: (val) => val === "unscramble",
    tokens: (val) =>
      Validators.isArray(val) &&
      val.every(
        (t) =>
          Validators.isArray(t) &&
          t.length === 2 &&
          t.every(Validators.isString),
      ),
    translation: Validators.isString,
  },
};
