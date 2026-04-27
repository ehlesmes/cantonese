import { describe, it, expect, beforeEach } from "vitest";
import { ChapterItem } from "./chapter_item.js";

describe("ChapterItem Component", () => {
  const mockData = {
    chapterId: "1",
    chapterName: "Basics",
    lessons: [{ lessonId: "1.1", lessonName: "Greetings" }],
    progress: { 1.1: { completed: true } },
    open: true,
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if chapterId is missing", () => {
      expect(
        () => new ChapterItem({ chapterName: "A", lessons: [] }),
      ).toThrow();
    });
  });

  it("should render chapter name", () => {
    const item = new ChapterItem(mockData);
    expect(item.shadowRoot.querySelector(".chapter-name").textContent).toBe(
      "Basics",
    );
  });

  it("should render lessons with correct status", () => {
    const item = new ChapterItem(mockData);
    const lessonRow =
      item.shadowRoot.querySelector("lesson-row") ||
      item.shadowRoot.querySelector(".lesson-list").firstChild;
    // Note: Since lesson-row is a custom component, we check its element/component
    expect(lessonRow.component.status).toBe("completed");
  });

  it("should reflect open state in details element", () => {
    const item = new ChapterItem(mockData);
    expect(item.shadowRoot.querySelector("details").open).toBe(true);
  });
});
