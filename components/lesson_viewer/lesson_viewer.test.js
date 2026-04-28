import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonViewer } from "./lesson_viewer.js";
import { Progress } from "../shared/progress.js";
import { LessonProvider } from "../shared/lesson_provider.js";
import { ExerciseProvider } from "../shared/exercise_provider.js";

vi.mock("../shared/tts.js", () => ({
  getCantoneseVoiceCount: vi.fn(() => 1),
  speakCantonese: vi.fn(),
}));

vi.mock("../shared/progress.js", () => ({
  Progress: {
    getLessonProgress: vi.fn(() => 0),
    saveLessonProgress: vi.fn(),
    completeLesson: vi.fn(),
    addExercisesToPractice: vi.fn(),
  },
}));

vi.mock("../shared/lesson_provider.js", () => ({
  LessonProvider: {
    getLessonData: vi.fn(),
  },
}));

vi.mock("../shared/exercise_provider.js", () => ({
  ExerciseProvider: {
    getExercise: vi.fn(),
    prefetch: vi.fn(),
  },
}));

describe("LessonViewer Component", () => {
  const mockLesson = {
    version: 1,
    pages: [
      { pageId: "1.1.1", type: "explanation", content: [] },
      { pageId: "1.1.2", type: "reading" },
      { pageId: "1.1.3", type: "unscramble" },
      {
        pageId: "1.1.4",
        type: "dialog",
        lines: [
          {
            speaker: "A",
            cantonese: "你好",
            romanization: "nei5 hou2",
            translation: "Hello",
          },
        ],
      },
      {
        pageId: "1.1.5",
        type: "congratulations",
        title: "Done",
        summary: "Good job",
        nextLessonId: "1.2",
      },
    ],
  };

  const mockExercise = {
    version: 1,
    type: "reading",
    cantonese: "你好",
    romanization: "nei5 hou2",
    translation: "Hello",
  };

  const mockUnscramble = {
    version: 1,
    type: "unscramble",
    tokens: [["你好", "nei5 hou2"]],
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
    Progress.getLessonProgress.mockReturnValue(0);
    LessonProvider.getLessonData.mockResolvedValue(mockLesson);
    ExerciseProvider.getExercise.mockImplementation((path) => {
      if (path.includes("1.1.2.json")) return Promise.resolve(mockExercise);
      if (path.includes("1.1.3.json")) return Promise.resolve(mockUnscramble);
      return Promise.reject(new Error("Unknown exercise path"));
    });
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
    expect(ExerciseProvider.getExercise).toHaveBeenCalledWith(
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
    expect(ExerciseProvider.getExercise).toHaveBeenCalledWith(
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

    // Page 1 of 5: progress should be 20%
    expect(progressBar.style.width).toBe("20%");

    await component.navigateTo(1);
    // Page 2 of 5: progress should be 40%
    expect(progressBar.style.width).toBe("40%");
  });

  it("should render all page types correctly", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    for (let i = 0; i < mockLesson.pages.length; i++) {
      await component.navigateTo(i);
      const main = component.querySelector("#m");
      const page = main.firstElementChild;
      expect(page).not.toBeNull();

      // Check for error message
      const error =
        page.shadowRoot?.querySelector(".error") ||
        page.querySelector(".error");
      if (error) {
        throw new Error(
          `Page type ${mockLesson.pages[i].type} failed to render: ${error.textContent}`,
        );
      }
    }
  });

  it("should complete lesson and add to practice when rendering congratulations", async () => {
    const component = new LessonViewer({
      lessonId: "1.1",
      lessonName: "Test Lesson",
    });
    await component.ready;

    await component.navigateTo(4); // Congratulations page (index 4 now)

    expect(Progress.completeLesson).toHaveBeenCalledWith("1.1");
    expect(Progress.addExercisesToPractice).toHaveBeenCalledWith([
      "1/1/1.1.2.json",
      "1/1/1.1.3.json",
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
