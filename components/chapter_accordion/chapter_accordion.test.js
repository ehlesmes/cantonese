import { describe, it, expect, beforeEach } from "vitest";
import { ChapterAccordion } from "./chapter_accordion.js";

describe("ChapterAccordion Component", () => {
  const mockData = {
    chapters: [
      { id: "1", name: "Basics", lessons: [] },
      { id: "2", name: "Numbers", lessons: [] },
    ],
    progress: {},
    activeChapterId: "2",
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should render all chapters", () => {
    const accordion = new ChapterAccordion(mockData);
    const items = accordion.shadowRoot.querySelectorAll(
      ".chapter-accordion > *",
    );
    expect(items.length).toBe(2);
  });

  it("should open the active chapter", () => {
    const accordion = new ChapterAccordion(mockData);
    const items = accordion.shadowRoot.querySelectorAll(
      ".chapter-accordion > *",
    );

    // First chapter should be closed
    expect(items[0].component.shadowRoot.querySelector("details").open).toBe(
      false,
    );
    // Second chapter (active) should be open
    expect(items[1].component.shadowRoot.querySelector("details").open).toBe(
      true,
    );
  });
});
