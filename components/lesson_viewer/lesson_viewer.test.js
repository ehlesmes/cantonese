import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonViewer } from "./lesson_viewer.js";
import { Progress } from "../shared/progress.js";

vi.mock("../shared/progress.js", () => ({
  Progress: {
    getLessonProgress: vi.fn(() => 0),
    saveLessonProgress: vi.fn(),
    completeLesson: vi.fn(),
    addExercisesToPractice: vi.fn(),
  },
}));

describe("LessonViewer Component", () => {
  const mockLesson = [
    { pageId: "1.1.1", type: "explanation", content: [] },
    { pageId: "1.1.2", type: "reading" },
    {
      pageId: "1.1.3",
      type: "congratulations",
      title: "Done",
      summary: "Good job",
    },
  ];

  const mockExercise = {
    cantonese: "你好",
    romanization: "nei5 hou2",
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
    Progress.getLessonProgress.mockReturnValue(0);
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

  it("should start at saved progress index", async () => {
    Progress.getLessonProgress.mockReturnValue(1);
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    expect(component._currentPageIndex).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("1.1.2.json"),
    );
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

  it("should navigate when header control buttons are clicked", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    const navigateSpy = vi.spyOn(component, "navigateTo");
    const header = component.shadowRoot.querySelector("#header");
    const controls = header.shadowRoot.getElementById("controls");

    // Click Next
    controls.shadowRoot.getElementById("next").click();
    expect(navigateSpy).toHaveBeenCalledWith(1);

    // Click Restart
    controls.shadowRoot.getElementById("restart").click();
    expect(navigateSpy).toHaveBeenCalledWith(0);
  });

  it("should dispatch 'close' when header close button is clicked", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    const closeSpy = vi.fn();
    component.element.addEventListener("close", closeSpy);

    const header = component.shadowRoot.querySelector("#header");
    const controls = header.shadowRoot.getElementById("controls");
    controls.shadowRoot.getElementById("close").click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should update header progress on navigation", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    const header = component.querySelector("#header");
    const progressBar = header.shadowRoot.querySelector(".progress-bar");

    // Page 1 of 3: progress should be ~33.3%
    expect(progressBar.style.width).toBe("33.33333333333333%");

    await component.navigateTo(1);
    // Page 2 of 3: progress should be ~66.6%
    expect(progressBar.style.width).toBe("66.66666666666666%");
  });

  it("should complete lesson and add to practice when rendering congratulations", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    await component.navigateTo(2); // Congratulations page

    expect(Progress.completeLesson).toHaveBeenCalledWith("1.1");
    expect(Progress.addExercisesToPractice).toHaveBeenCalledWith([
      "1/1/1.1.2.json",
    ]);
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new LessonViewer({});
      }).toThrow();
    });
  });
});
