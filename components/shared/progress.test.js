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

  it("should get exercise level", () => {
    Progress.addExercisesToPractice(["test.json"]);
    expect(Progress.getExerciseLevel("test.json")).toBe(1);

    Progress.updatePracticeResult("test.json", true);
    expect(Progress.getExerciseLevel("test.json")).toBe(2);

    expect(Progress.getExerciseLevel("non-existent")).toBe(null);
  });

  it("should get all practice exercises with levels", () => {
    Progress.addExercisesToPractice(["e1.json", "e2.json"]);
    Progress.updatePracticeResult("e2.json", true);

    const all = Progress.getAllPracticeExercises();
    expect(all).toContainEqual({ exerciseId: "e1.json", level: 1 });
    expect(all).toContainEqual({ exerciseId: "e2.json", level: 2 });
    expect(all.length).toBe(2);
  });

  describe("Recovery and Migration", () => {
    it("should recover from completely corrupted state", () => {
      window.localStorage.setItem("cantonese_progress", "invalid-json");
      const progress = Progress.getLessonProgress("1.1");
      expect(progress).toBe(0);

      // Assert that we logged the error
      expect(console.error).toHaveBeenCalledWith(
        "Failed to parse progress from localStorage",
        expect.any(SyntaxError),
      );
      vi.mocked(console.error).mockClear();

      const state = JSON.parse(
        window.localStorage.getItem("cantonese_progress"),
      );
      expect(state.version).toBe(1);
      expect(state.practice.levels[1]).toEqual([]);
    });

    it("should recover missing fields from partial state", () => {
      const partial = { version: 1, lessons: {} }; // Missing practice
      window.localStorage.setItem(
        "cantonese_progress",
        JSON.stringify(partial),
      );

      const session = Progress.getPracticeSession();
      expect(session).toEqual([]);

      const state = JSON.parse(
        window.localStorage.getItem("cantonese_progress"),
      );
      expect(state.practice.levels[1]).toBeDefined();
    });

    it("should filter out non-string IDs from practice levels", () => {
      const corrupted = {
        version: 1,
        lessons: {},
        practice: {
          levels: {
            1: ["valid.json", 123, { id: "bad" }],
            2: [],
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
      window.localStorage.setItem(
        "cantonese_progress",
        JSON.stringify(corrupted),
      );

      const all = Progress.getAllPracticeExercises();
      expect(all).toEqual([{ exerciseId: "valid.json", level: 1 }]);
    });
  });
});
