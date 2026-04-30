import { describe, it, expect, beforeEach } from "vitest";
import { ChapterAccordion } from "./chapter_accordion.js";

describe("ChapterAccordion Component", () => {
  const mockData = {
    chapters: [
      { chapterId: "1", chapterName: "Basics", lessons: [] },
      { chapterId: "2", chapterName: "Numbers", lessons: [] },
    ],
    progress: {},
    activeLesson: { id: null, pageIndex: 0 },
    activeChapterId: "2",
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if chapters is missing", () => {
      expect(
        () =>
          new ChapterAccordion({
            progress: {},
            activeLesson: { id: null, pageIndex: 0 },
          }),
      ).toThrow();
    });

    it("should throw if progress is missing", () => {
      expect(
        () =>
          new ChapterAccordion({
            chapters: [],
            activeLesson: { id: null, pageIndex: 0 },
          }),
      ).toThrow();
    });

    it("should throw if activeLesson is missing", () => {
      expect(() => new ChapterAccordion({ chapters: [], progress: {} })).toThrow();
    });
  });

  it("should render all chapters", () => {
    const accordion = new ChapterAccordion(mockData);
    const items = accordion.shadowRoot.querySelectorAll(".chapter-accordion > *");
    expect(items.length).toBe(2);
  });

  it("should open the active chapter", () => {
    const accordion = new ChapterAccordion(mockData);
    const items = accordion.shadowRoot.querySelectorAll(".chapter-accordion > *");

    // First chapter should be closed
    expect(items[0].component.shadowRoot.querySelector("details").open).toBe(false);
    // Second chapter (active) should be open
    expect(items[1].component.shadowRoot.querySelector("details").open).toBe(true);
  });
});
