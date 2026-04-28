import { describe, it, expect } from "vitest";
import { validateObject } from "./validator.js";
import { Schemas } from "./lessons.js";

describe("Lesson Schemas", () => {
  describe("lessonsJson", () => {
    it("should validate a correct manifest", () => {
      const data = {
        version: 1,
        chapters: [
          {
            chapterId: "1",
            chapterName: "Basic",
            lessons: [{ lessonId: "1.1", lessonName: "Hi" }],
          },
        ],
      };
      expect(validateObject(data, Schemas.lessonsJson)).toEqual([]);
    });

    it("should catch missing version", () => {
      const data = { chapters: [] };
      expect(validateObject(data, Schemas.lessonsJson)).toContain(
        'Invalid or missing value for "version": undefined',
      );
    });
  });

  describe("lessonDetail (Page Union)", () => {
    it("should validate all page types", () => {
      const data = {
        version: 1,
        pages: [
          {
            pageId: "1",
            type: "explanation",
            content: [{ type: "title", value: "Hi" }],
          },
          { pageId: "2", type: "reading" },
          { pageId: "3", type: "unscramble" },
          {
            pageId: "4",
            type: "congratulations",
            title: "T",
            summary: "S",
            nextLessonId: null,
          },
        ],
      };
      expect(validateObject(data, Schemas.lessonDetail)).toEqual([]);
    });

    it("should validate explanation with example type", () => {
      const data = {
        version: 1,
        pages: [
          {
            pageId: "1",
            type: "explanation",
            content: [
              {
                type: "example",
                cantonese: "C",
                romanization: "R",
                translation: "T",
              },
            ],
          },
        ],
      };
      expect(validateObject(data, Schemas.lessonDetail)).toEqual([]);
    });

    it("should catch invalid example type (missing fields)", () => {
      const data = {
        version: 1,
        pages: [
          {
            pageId: "1",
            type: "explanation",
            content: [{ type: "example", value: "should not have value" }],
          },
        ],
      };
      const errors = validateObject(data, Schemas.lessonDetail);
      expect(errors.join()).toContain(
        'Invalid or missing value for "content[0].value"',
      );
      expect(errors.join()).toContain(
        'Invalid or missing value for "content[0].cantonese"',
      );
    });

    it("should catch invalid explanation content", () => {
      const data = {
        version: 1,
        pages: [
          {
            pageId: "1",
            type: "explanation",
            content: [{ type: "title", value: 123 }], // Invalid value type
          },
        ],
      };
      const errors = validateObject(data, Schemas.lessonDetail);
      expect(errors.join()).toContain(
        'Invalid or missing value for "content[0].value": 123',
      );
    });

    it("should catch unknown page type", () => {
      const data = {
        version: 1,
        pages: [{ pageId: "1", type: "magic" }],
      };
      expect(validateObject(data, Schemas.lessonDetail)).toContain(
        'pages[0].Unknown page type "magic"',
      );
    });
  });

  describe("Exercises", () => {
    it("should validate reading exercise", () => {
      const data = {
        version: 1,
        type: "reading",
        cantonese: "C",
        romanization: "R",
        translation: "T",
      };
      expect(validateObject(data, Schemas.readingExercise)).toEqual([]);
    });

    it("should validate unscramble exercise", () => {
      const data = {
        version: 1,
        type: "unscramble",
        tokens: [
          ["A", "a"],
          ["B", "b"],
        ],
        translation: "T",
      };
      expect(validateObject(data, Schemas.unscrambleExercise)).toEqual([]);
    });

    it("should catch invalid tokens", () => {
      const data = {
        version: 1,
        type: "unscramble",
        tokens: ["invalid"],
        translation: "T",
      };
      expect(validateObject(data, Schemas.unscrambleExercise)).toContain(
        'Invalid or missing value for "tokens": ["invalid"]',
      );
    });
  });
});
