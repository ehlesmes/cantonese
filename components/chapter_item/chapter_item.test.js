import { describe, it, expect, beforeEach } from "vitest";
import { ChapterItem } from "./chapter_item.js";

describe("ChapterItem Component", () => {
  const mockData = {
    chapterId: "1",
    chapterName: "Basics",
    lessons: [
      { lessonId: "1.1", lessonName: "Greetings" },
      { lessonId: "1.2", lessonName: "Numbers" },
    ],
    progress: { 1.1: { completed: true } },
    activeLesson: { id: "1.2", pageIndex: 3 },
    open: true,
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if chapterId is missing", () => {
      expect(
        () =>
          new ChapterItem({
            chapterName: "A",
            lessons: [],
            progress: {},
            activeLesson: { id: null, pageIndex: 0 },
          }),
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
    const lessonRows = Array.from(
      item.shadowRoot.querySelectorAll("div.lesson-list > *"),
    );

    // 1.1 should be completed
    expect(lessonRows[0].component.status).toBe("completed");

    // 1.2 should be in-progress
    expect(lessonRows[1].component.status).toBe("in-progress");
  });

  it("should reflect open state in details element", () => {
    const item = new ChapterItem(mockData);
    expect(item.shadowRoot.querySelector("details").open).toBe(true);
  });
});
