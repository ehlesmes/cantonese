import { describe, it, expect } from "vitest";
import { ProgressSchema, migrateOrRecover, CURRENT_VERSION, MAX_LEVEL } from "./progress.js";
import { validateObject } from "./validator.js";

describe("Progress Schema", () => {
  it("should validate a correct progress object", () => {
    const validState = {
      version: 2,
      activeLesson: { id: "1.1", pageIndex: 2 },
      lessons: {
        1.1: { completed: true },
      },
      practice: {
        levels: {
          1: ["exercise1.json"],
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
    const errors = validateObject(validState, ProgressSchema);
    expect(errors).toEqual([]);
  });

  it("should fail on invalid version", () => {
    const invalidState = {
      version: "1",
      lessons: {},
      practice: { levels: {} },
    };
    const errors = validateObject(invalidState, ProgressSchema);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail on invalid levels", () => {
    const invalidState = {
      version: 1,
      lessons: {},
      practice: {
        levels: {
          11: [], // Level out of range
        },
      },
    };
    const errors = validateObject(invalidState, ProgressSchema);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("migrateOrRecover", () => {
  it("should return default state for null/undefined", () => {
    const state = migrateOrRecover(null);
    expect(state.version).toBe(CURRENT_VERSION);
    expect(state.activeLesson).toEqual({ id: null, pageIndex: 0 });
    expect(state.lessons).toEqual({});
    expect(Object.keys(state.practice.levels).length).toBe(MAX_LEVEL);
  });

  it("should recover and migrate v1 partial data", () => {
    const partialState = {
      version: 1,
      lessons: {
        1.1: { lastPageIndex: 5 },
      },
    };
    const recovered = migrateOrRecover(partialState);
    expect(recovered.version).toBe(CURRENT_VERSION);
    expect(recovered.activeLesson).toEqual({ id: "1.1", pageIndex: 5 });
    expect(recovered.lessons["1.1"]).toEqual({
      completed: false,
    });
    expect(recovered.practice.levels[1]).toEqual([]);
  });

  it("should filter out invalid level entries", () => {
    const state = {
      practice: {
        levels: {
          1: ["valid.json", 123, null],
        },
      },
    };
    const recovered = migrateOrRecover(state);
    expect(recovered.practice.levels[1]).toEqual(["valid.json"]);
  });

  it("should handle completely corrupted state by returning defaults", () => {
    const corrupted = "not-an-object";
    const state = migrateOrRecover(corrupted);
    expect(state.version).toBe(CURRENT_VERSION);
    expect(state.lessons).toEqual({});
  });
});
