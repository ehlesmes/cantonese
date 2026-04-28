import { Validators, validateObject } from "./validator.js";

export const CURRENT_VERSION = 1;
export const MAX_LEVEL = 10;

export const ProgressSchema = {
  version: Validators.isNumber,
  lessons: (val) => {
    if (!val || typeof val !== "object" || Array.isArray(val)) return false;
    return Object.values(val).every(
      (lessonProgress) =>
        typeof lessonProgress.lastPageIndex === "number" &&
        (lessonProgress.completed === undefined ||
          typeof lessonProgress.completed === "boolean"),
    );
  },
  practice: {
    levels: (val) => {
      if (!val || typeof val !== "object" || Array.isArray(val)) return false;
      return Object.entries(val).every(([key, value]) => {
        const level = parseInt(key, 10);
        return (
          level >= 1 &&
          level <= 10 &&
          Validators.isArray(value) &&
          value.every(Validators.isString)
        );
      });
    },
  },
};

/**
 * Ensures a progress state object is valid and up-to-date.
 * Performs migrations and fills in missing structures.
 * @param {Object} state The state from localStorage.
 * @returns {Object} A valid state object.
 */
export function migrateOrRecover(state) {
  const defaultState = {
    version: CURRENT_VERSION,
    lessons: {},
    practice: { levels: {} },
  };

  for (let i = 1; i <= MAX_LEVEL; i++) {
    defaultState.practice.levels[i] = [];
  }

  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return defaultState;
  }

  // Version check (placeholder for future migrations)
  if (state.version && state.version < CURRENT_VERSION) {
    // Migration logic would go here
  }

  const recovered = { ...defaultState };

  // Recover version
  recovered.version =
    typeof state.version === "number" ? state.version : CURRENT_VERSION;

  // Recover lessons
  if (
    state.lessons &&
    typeof state.lessons === "object" &&
    !Array.isArray(state.lessons)
  ) {
    Object.entries(state.lessons).forEach(([lessonId, data]) => {
      if (data && typeof data === "object") {
        recovered.lessons[lessonId] = {
          lastPageIndex:
            typeof data.lastPageIndex === "number" ? data.lastPageIndex : 0,
          completed:
            typeof data.completed === "boolean" ? data.completed : false,
        };
      }
    });
  }

  // Recover practice levels
  if (
    state.practice &&
    state.practice.levels &&
    typeof state.practice.levels === "object"
  ) {
    for (let i = 1; i <= MAX_LEVEL; i++) {
      const levelData = state.practice.levels[i];
      if (Validators.isArray(levelData)) {
        // Filter out non-string IDs
        recovered.practice.levels[i] = levelData.filter(Validators.isString);
      }
    }
  }

  // Final validation check to ensure recovery didn't miss something
  const errors = validateObject(recovered, ProgressSchema);
  if (errors.length > 0) {
    console.error("Failed to recover progress state, using defaults", errors);
    return defaultState;
  }

  return recovered;
}
