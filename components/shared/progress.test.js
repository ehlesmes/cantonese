import { describe, it, expect, beforeEach, vi } from "vitest";
import { Progress } from "./progress.js";

describe("Progress Utility", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const progress = Progress.getLessonProgress("1.1");
    expect(progress).toBe(0);
  });

  it("should save and retrieve lesson progress", () => {
    Progress.saveLessonProgress("1.1", 5);
    expect(Progress.getLessonProgress("1.1")).toBe(5);
  });

  it("should mark lesson as completed", () => {
    Progress.completeLesson("1.1");
    const state = JSON.parse(window.localStorage.getItem("cantonese_progress"));
    expect(state.lessons["1.1"].completed).toBe(true);
  });

  it("should add new exercises to practice level 1", () => {
    Progress.addExercisesToPractice(["1/1/1.1.2.json", "1/1/1.1.3.json"]);
    const state = JSON.parse(window.localStorage.getItem("cantonese_progress"));
    expect(state.practice.levels[1]).toContain("1/1/1.1.2.json");
    expect(state.practice.levels[1]).toContain("1/1/1.1.3.json");
  });

  it("should not add duplicate exercises to practice", () => {
    Progress.addExercisesToPractice(["1/1/1.1.2.json"]);
    Progress.addExercisesToPractice(["1/1/1.1.2.json"]);
    const state = JSON.parse(window.localStorage.getItem("cantonese_progress"));
    expect(
      state.practice.levels[1].filter((id) => id === "1/1/1.1.2.json").length,
    ).toBe(1);
  });

  it("should promote exercise level on success", () => {
    Progress.addExercisesToPractice(["test.json"]);
    Progress.updatePracticeResult("test.json", true);
    const state = JSON.parse(window.localStorage.getItem("cantonese_progress"));
    expect(state.practice.levels[1]).not.toContain("test.json");
    expect(state.practice.levels[2]).toContain("test.json");
  });

  it("should demote exercise to level 1 on failure", () => {
    // Manually set to level 3
    const state = {
      version: 1,
      lessons: {},
      practice: {
        levels: {
          1: [],
          2: [],
          3: ["fail.json"],
          4: [],
          5: [],
          6: [],
          7: [],
          8: [],
          9: [],
          10: [],
        },
      },
    };
    window.localStorage.setItem("cantonese_progress", JSON.stringify(state));

    Progress.updatePracticeResult("fail.json", false);
    const updatedState = JSON.parse(
      window.localStorage.getItem("cantonese_progress"),
    );
    expect(updatedState.practice.levels[3]).not.toContain("fail.json");
    expect(updatedState.practice.levels[1]).toContain("fail.json");
  });

  it("should cap at level 10", () => {
    const state = {
      version: 1,
      lessons: {},
      practice: {
        levels: {
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: [],
          7: [],
          8: [],
          9: [],
          10: ["cap.json"],
        },
      },
    };
    window.localStorage.setItem("cantonese_progress", JSON.stringify(state));

    Progress.updatePracticeResult("cap.json", true);
    const updatedState = JSON.parse(
      window.localStorage.getItem("cantonese_progress"),
    );
    expect(updatedState.practice.levels[10]).toContain("cap.json");
  });

  it("should get up to 10 exercises for a session", () => {
    const ids = Array.from({ length: 15 }, (_, i) => `exercise${i}.json`);
    Progress.addExercisesToPractice(ids);

    const session = Progress.getPracticeSession();
    expect(session.length).toBe(10);
    expect(session[0]).toBe("exercise0.json");
  });

  it("should prioritize lower levels in sessions", () => {
    const state = {
      version: 1,
      lessons: {},
      practice: {
        levels: {
          1: ["low.json"],
          2: ["high.json"],
          3: [],
          4: [],
          5: [],
          6: [],
          7: [],
          8: [],
          9: [],
          10: [],
        },
      },
    };
    window.localStorage.setItem("cantonese_progress", JSON.stringify(state));

    const session = Progress.getPracticeSession();
    expect(session).toEqual(["low.json", "high.json"]);
  });
});
