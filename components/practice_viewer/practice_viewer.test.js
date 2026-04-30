import { describe, it, expect, beforeEach, vi } from "vitest";
import { PracticeViewer } from "./practice_viewer.js";
import { Progress } from "../shared/progress.js";
import { ExerciseProvider } from "../shared/exercise_provider.js";

vi.mock("../shared/progress.js", () => ({
  Progress: {
    getPracticeSession: vi.fn(),
    updatePracticeResult: vi.fn(),
    getLessonProgress: vi.fn(() => 0),
    saveLessonProgress: vi.fn(),
    completeLesson: vi.fn(),
    addExercisesToPractice: vi.fn(),
    getPracticeCount: vi.fn(() => 0),
  },
}));

vi.mock("../shared/exercise_provider.js", () => ({
  ExerciseProvider: {
    getExercise: vi.fn(),
  },
}));

describe("PracticeViewer Component", () => {
  const mockExercise = {
    version: 1,
    type: "reading",
    cantonese: "你好",
    romanization: "nei5 hou2",
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
    ExerciseProvider.getExercise.mockResolvedValue(mockExercise);
  });

  it("should be defined", () => {
    Progress.getPracticeSession.mockReturnValue([]);
    const component = new PracticeViewer();
    expect(component).toBeDefined();
  });

  it("should show empty state if no exercises", () => {
    Progress.getPracticeSession.mockReturnValue([]);
    const component = new PracticeViewer();
    const main = component.shadowRoot.querySelector("#m");
    // Should render PracticeEmptyPage (which is currently a div in the registry)
    expect(main.firstElementChild).not.toBeNull();
  });

  it("should load and render first exercise in session", async () => {
    Progress.getPracticeSession.mockReturnValue(["1/1/1.1.2.json"]);
    const component = new PracticeViewer();

    // We need to wait for the fetch in _renderCurrentExercise
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ExerciseProvider.getExercise).toHaveBeenCalledWith("1/1/1.1.2.json");
    const main = component.shadowRoot.querySelector("#m");
    expect(main.innerHTML).not.toContain("Loading");
  });

  it("should handle exercise results and update SRS", async () => {
    Progress.getPracticeSession.mockReturnValue(["ex1.json", "ex2.json"]);
    const component = new PracticeViewer();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate result dispatch from child page
    component.element.dispatchEvent(
      new CustomEvent("reading-result", {
        detail: { success: true },
        bubbles: true,
        composed: true,
      }),
    );

    expect(Progress.updatePracticeResult).toHaveBeenCalledWith("ex1.json", true);

    // Should move to next exercise
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ExerciseProvider.getExercise).toHaveBeenCalledWith("ex2.json");
  });

  it("should show summary after last exercise", async () => {
    Progress.getPracticeSession.mockReturnValue(["ex1.json"]);
    const component = new PracticeViewer();
    await new Promise((resolve) => setTimeout(resolve, 0));

    component.element.dispatchEvent(
      new CustomEvent("reading-result", {
        detail: { success: true },
        bubbles: true,
        composed: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    const main = component.shadowRoot.querySelector("#m");
    expect(main.innerHTML).not.toContain("Loading");
  });

  it("should dispatch 'go-home' when header close button is clicked", () => {
    Progress.getPracticeSession.mockReturnValue([]);
    const viewer = new PracticeViewer();
    const spy = vi.fn();
    viewer.element.addEventListener("go-home", spy);

    // Click Close button in header
    const header = viewer.shadowRoot.querySelector("#header");
    const controls = header.shadowRoot.getElementById("controls");
    controls.shadowRoot.getElementById("close").click();

    expect(spy).toHaveBeenCalled();
  });

  describe("Validation", () => {
    it("should not throw with empty constructor", () => {
      expect(() => new PracticeViewer()).not.toThrow();
    });
  });
});
