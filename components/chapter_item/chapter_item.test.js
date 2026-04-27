import { describe, it, expect, beforeEach } from "vitest";
import { ChapterItem } from "./chapter_item.js";

describe("ChapterItem Component", () => {
  const mockData = {
    id: "1",
    name: "Basics",
    lessons: [{ id: "1.1", name: "Greetings" }],
    progress: { 1.1: { completed: true } },
    open: true,
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if id is missing", () => {
      expect(() => new ChapterItem({ name: "A", lessons: [] })).toThrow();
    });
  });

  it("should render chapter id and name", () => {
    const item = new ChapterItem(mockData);
    expect(item.shadowRoot.querySelector(".chapter-id").textContent).toContain(
      "Chapter 1",
    );
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
