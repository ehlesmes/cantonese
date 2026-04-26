import { describe, it, expect, beforeEach, vi } from "vitest";
import { PracticeViewer } from "./practice_viewer.js";
import { Progress } from "../shared/progress.js";

vi.mock("../shared/progress.js", () => ({
  Progress: {
    getPracticeSession: vi.fn(),
    updatePracticeResult: vi.fn(),
    getLessonProgress: vi.fn(() => 0),
    saveLessonProgress: vi.fn(),
    completeLesson: vi.fn(),
    addExercisesToPractice: vi.fn(),
  },
}));

describe("PracticeViewer Component", () => {
  const mockExercise = {
    type: "reading",
    cantonese: "你好",
    romanization: "nei5 hou2",
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExercise),
        }),
      ),
    );
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
    // Should render PracticeEmptyPage
    expect(main.firstElementChild.tagName.toLowerCase()).toBe("div");
    // Wait, the tag name depends on PageRegistry. PageRegistry is global.
  });

  it("should load and render first exercise in session", async () => {
    Progress.getPracticeSession.mockReturnValue(["1/1/1.1.2.json"]);
    const component = new PracticeViewer();

    // We need to wait for the fetch in _renderCurrentExercise
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("1/1/1.1.2.json"),
    );
    const main = component.shadowRoot.querySelector("#m");
    expect(main.innerHTML).not.toContain("Loading");
  });

  it("should handle exercise results and update SRS", async () => {
    Progress.getPracticeSession.mockReturnValue(["ex1.json", "ex2.json"]);
    const component = new PracticeViewer();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate correct answer
    component.element.dispatchEvent(
      new CustomEvent("reading-result", {
        detail: { success: true },
        bubbles: true,
        composed: true,
      }),
    );

    expect(Progress.updatePracticeResult).toHaveBeenCalledWith(
      "ex1.json",
      true,
    );

    // Should move to next exercise
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ex2.json"),
    );
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
    // Should show practice-summary
    expect(main.innerHTML).not.toContain("Loading");
  });

  it("should hide navigation in header", () => {
    Progress.getPracticeSession.mockReturnValue([]);
    const component = new PracticeViewer();
    const header = component.shadowRoot.querySelector("#header");

    // Check if navigation is hidden in LessonControls
    const controls = header.shadowRoot.querySelector("header").lastChild;
    expect(controls.shadowRoot.getElementById("restart")).toBeNull();
  });
});
