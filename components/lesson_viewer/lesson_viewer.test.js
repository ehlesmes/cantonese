import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonViewer } from "./lesson_viewer.js";

describe("LessonViewer Component", () => {
  const mockLesson = [
    { id: "1.1.1", type: "explanation", content: [] },
    { id: "1.1.2", type: "reading" },
  ];

  const mockExercise = {
    cantonese: "你好",
    romanization: "nei5 hou2",
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.includes("data/lessons")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLesson),
          });
        }
        if (url.includes("data/exercises")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExercise),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      }),
    );
  });

  it("should be defined", () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    expect(component).toBeInstanceOf(LessonViewer);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should load lesson and render first page", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    const title = component
      .querySelector("#header")
      .shadowRoot.getElementById("lesson-title");
    expect(title.textContent).toBe("Test Lesson");

    const main = component.querySelector("#m");
    expect(
      main.firstElementChild.shadowRoot.querySelector(".page-container"),
    ).not.toBeNull();
  });

  it("should navigate between pages", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    // First page (explanation)
    const main = component.querySelector("#m");
    expect(
      main.firstElementChild.shadowRoot.querySelector(".page-container"),
    ).not.toBeNull();

    // Navigate to second page
    await component.navigateTo(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("1.1.2.json"),
    );
  });

  it("should handle navigation events", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    const navigateSpy = vi.spyOn(component, "navigateTo");

    // Click next via event
    component.element.dispatchEvent(new CustomEvent("next"));
    expect(navigateSpy).toHaveBeenCalledWith(1);

    // Click restart
    component.element.dispatchEvent(new CustomEvent("restart"));
    expect(navigateSpy).toHaveBeenCalledWith(0);
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new LessonViewer({});
      }).toThrow();
    });
  });
});
