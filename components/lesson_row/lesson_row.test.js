import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonRow } from "./lesson_row.js";

describe("LessonRow Component", () => {
  const mockData = {
    lessonId: "1.1",
    lessonName: "Greetings",
    status: "completed",
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should render lesson id and name", () => {
    const row = new LessonRow(mockData);
    expect(row.shadowRoot.querySelector(".lesson-id").textContent).toBe(
      `Lesson ${mockData.lessonId}`,
    );
    expect(row.shadowRoot.querySelector(".lesson-name").textContent).toBe(mockData.lessonName);
  });

  it("should render a StatusIcon with correct status", () => {
    const row = new LessonRow(mockData);
    const statusIconEl = row.shadowRoot.querySelector(".lesson-row").firstChild;
    expect(
      statusIconEl.component.shadowRoot
        .querySelector(".status-icon")
        .classList.contains("completed"),
    ).toBe(true);
  });

  it("should dispatch 'lesson-click' when clicked", () => {
    const row = new LessonRow(mockData);
    const handler = vi.fn();
    row.element.addEventListener("lesson-click", handler);

    row.shadowRoot.querySelector(".lesson-row").click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { lessonId: "1.1" },
      }),
    );
  });

  it("should update status dynamically via setter", () => {
    const row = new LessonRow(mockData);
    row.status = "in-progress";

    const rowDiv = row.shadowRoot.querySelector(".lesson-row");
    expect(rowDiv.classList.contains("in-progress")).toBe(true);

    const statusIconEl = rowDiv.firstChild;
    expect(statusIconEl.component.status).toBe("in-progress");
  });

  describe("Validation", () => {
    it("should throw error if required properties are missing", () => {
      expect(() => new LessonRow({})).toThrow("Missing property: lessonId");
    });
  });
});
