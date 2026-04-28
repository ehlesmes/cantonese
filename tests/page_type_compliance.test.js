import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { PAGE_TYPES } from "../schemas/lessons.js";
import { PageRegistry } from "../components/shared/page_registry.js";

// Import LessonViewer to trigger page registrations
import "../components/lesson_viewer/lesson_viewer.js";

describe("Page Type Compliance", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("all page types in schema should be registered in PageRegistry", () => {
    PAGE_TYPES.forEach((type) => {
      expect(
        PageRegistry.has(type),
        `Page type "${type}" is defined in schema but not registered in PageRegistry.
         Did you forget to import it in LessonViewer.js?`,
      ).toBe(true);
    });
  });

  it("all page types should be explicitly handled in LessonViewer.js rendering logic", () => {
    const viewerPath = path.resolve(
      process.cwd(),
      "components/lesson_viewer/lesson_viewer.js",
    );
    const content = fs.readFileSync(viewerPath, "utf-8");

    PAGE_TYPES.forEach((type) => {
      // Check if the type is explicitly mentioned in _renderPage logic
      // It should either be in an "if (pageDef.type === '...')" block or handled via ExerciseProvider (default)
      const isInline = content.includes(`pageDef.type === "${type}"`);
      const isFetched = ["reading", "unscramble"].includes(type); // Current fetched types

      // This is a bit heuristic but will fail if someone adds a type and doesn't update LessonViewer
      if (!isInline && !isFetched) {
        throw new Error(
          `Page type "${type}" is defined in schema but doesn't seem to be explicitly handled in LessonViewer._renderPage.
           If it's an inline page, add a check for it. If it's a fetched exercise, ensure it's intended to be fetched.`,
        );
      }
    });
  });

  it("all exercise types should be included in practice session logic in LessonViewer.js", () => {
    const viewerPath = path.resolve(
      process.cwd(),
      "components/lesson_viewer/lesson_viewer.js",
    );
    const content = fs.readFileSync(viewerPath, "utf-8");

    // Types that should be added to practice when lesson is completed
    const EXERCISE_TYPES = ["reading", "unscramble"];

    EXERCISE_TYPES.forEach((type) => {
      // Look for the filter logic in _prefetchExercises and _renderPage (congratulations block)
      const count = (
        content.match(new RegExp(`p.type === "${type}"`, "g")) || []
      ).length;
      expect(
        count,
        `Exercise type "${type}" should be included in prefetching and practice session logic (expected at least 2 occurrences in LessonViewer.js).`,
      ).toBeGreaterThanOrEqual(2);
    });
  });
});
