import { Validators, validateObject } from "./validator.js";

export const CURRENT_VERSION = 2;
export const MAX_LEVEL = 10;

export const ProgressSchema = {
  version: Validators.isNumber,
  activeLesson: (val) => {
    if (!val || typeof val !== "object" || Array.isArray(val)) return false;
    return (
      (val.id === null || typeof val.id === "string") &&
      typeof val.pageIndex === "number"
    );
  },
  lessons: (val) => {
    if (!val || typeof val !== "object" || Array.isArray(val)) return false;
    return Object.values(val).every(
      (lessonProgress) =>
        lessonProgress.completed === undefined ||
        typeof lessonProgress.completed === "boolean",
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
    activeLesson: { id: null, pageIndex: 0 },
    lessons: {},
    practice: { levels: {} },
  };

  for (let i = 1; i <= MAX_LEVEL; i++) {
    defaultState.practice.levels[i] = [];
  }

  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return defaultState;
  }

  // Version check & Migrations
  let currentState = { ...state };

  if (currentState.version === 1) {
    // Migrate v1 to v2:
    // 1. Move lesson completion status
    // 2. Pick first in-progress lesson as activeLesson
    const v2Lessons = {};
    let activeLesson = { id: null, pageIndex: 0 };

    if (currentState.lessons) {
      Object.entries(currentState.lessons).forEach(([id, data]) => {
        v2Lessons[id] = { completed: Boolean(data.completed) };
        // If not completed and has progress, and we don't have an active lesson yet
        if (!data.completed && data.lastPageIndex > 0 && !activeLesson.id) {
          activeLesson = { id, pageIndex: data.lastPageIndex };
        }
      });
    }

    currentState = {
      ...currentState,
      version: 2,
      activeLesson,
      lessons: v2Lessons,
    };
  }

  const recovered = { ...defaultState };

  // Recover version
  recovered.version =
    typeof currentState.version === "number"
      ? currentState.version
      : CURRENT_VERSION;

  // Recover activeLesson
  if (
    currentState.activeLesson &&
    typeof currentState.activeLesson === "object"
  ) {
    recovered.activeLesson = {
      id:
        typeof currentState.activeLesson.id === "string"
          ? currentState.activeLesson.id
          : null,
      pageIndex:
        typeof currentState.activeLesson.pageIndex === "number"
          ? currentState.activeLesson.pageIndex
          : 0,
    };
  }

  // Recover lessons
  if (
    currentState.lessons &&
    typeof currentState.lessons === "object" &&
    !Array.isArray(currentState.lessons)
  ) {
    Object.entries(currentState.lessons).forEach(([lessonId, data]) => {
      if (data && typeof data === "object") {
        recovered.lessons[lessonId] = {
          completed:
            typeof data.completed === "boolean" ? data.completed : false,
        };
      }
    });
  }

  // Recover practice levels
  if (
    currentState.practice &&
    currentState.practice.levels &&
    typeof currentState.practice.levels === "object"
  ) {
    for (let i = 1; i <= MAX_LEVEL; i++) {
      const levelData = currentState.practice.levels[i];
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
