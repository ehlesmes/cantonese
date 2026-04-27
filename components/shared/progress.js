const STORAGE_KEY = "cantonese_progress";
const MAX_LEVEL = 10;
const SESSION_SIZE = 10;

export const Progress = {
  /**
   * Retrieves the entire progress state from localStorage.
   * @returns {Object}
   */
  _getState() {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      const state = data
        ? JSON.parse(data)
        : { version: 1, lessons: {}, practice: { levels: {} } };

      // Initialize levels if they don't exist
      if (!state.practice.levels) state.practice.levels = {};
      for (let i = 1; i <= MAX_LEVEL; i++) {
        if (!state.practice.levels[i]) state.practice.levels[i] = [];
      }
      return state;
    } catch (e) {
      console.error("Failed to load progress from localStorage", e);
      return { version: 1, lessons: {}, practice: { levels: {} } };
    }
  },

  /**
   * Saves the entire progress state to localStorage.
   * @param {Object} state
   */
  _saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save progress to localStorage", e);
    }
  },

  /**
   * Saves the user's progress in a specific lesson.
   * @param {string} lessonId
   * @param {number} pageIndex
   */
  saveLessonProgress(lessonId, pageIndex) {
    const state = this._getState();
    if (!state.lessons[lessonId]) state.lessons[lessonId] = {};
    state.lessons[lessonId].lastPageIndex = pageIndex;
    this._saveState(state);
  },

  /**
   * Gets the saved page index for a lesson.
   * @param {string} lessonId
   * @returns {number}
   */
  getLessonProgress(lessonId) {
    const state = this._getState();
    return state.lessons[lessonId]?.lastPageIndex ?? 0;
  },

  /**
   * Marks a lesson as completed.
   * @param {string} lessonId
   */
  completeLesson(lessonId) {
    const state = this._getState();
    if (!state.lessons[lessonId]) state.lessons[lessonId] = {};
    state.lessons[lessonId].completed = true;
    this._saveState(state);
  },

  /**
   * Adds new exercises to the practice system (Level 1) if not already present.
   * @param {string[]} exerciseIds - List of path-based IDs (e.g., "1/1/1.1.2.json")
   */
  addExercisesToPractice(exerciseIds) {
    const state = this._getState();
    const allPracticedIds = new Set();

    // Collect all IDs currently in practice
    Object.values(state.practice.levels).forEach((levelArray) => {
      levelArray.forEach((id) => allPracticedIds.add(id));
    });

    // Add only new ones to Level 1
    exerciseIds.forEach((id) => {
      if (!allPracticedIds.has(id)) {
        state.practice.levels[1].push(id);
      }
    });

    this._saveState(state);
  },

  /**
   * Returns a list of up to 10 exercises for a practice session.
   * Selection starts from Level 1 up to Level 10.
   * @returns {string[]}
   */
  getPracticeSession() {
    const state = this._getState();
    const session = [];

    for (let i = 1; i <= MAX_LEVEL; i++) {
      const levelItems = state.practice.levels[i];
      for (const id of levelItems) {
        if (session.length < SESSION_SIZE) {
          session.push(id);
        } else {
          break;
        }
      }
      if (session.length >= SESSION_SIZE) break;
    }

    return session;
  },

  /**
   * Updates the level of an exercise based on the result.
   * Success: Move to next level (cap at 10).
   * Failure: Drop to Level 1.
   * @param {string} exerciseId
   * @param {boolean} isCorrect
   */
  updatePracticeResult(exerciseId, isCorrect) {
    const state = this._getState();
    let currentLevel = -1;

    // Find and remove from current level
    for (let i = 1; i <= MAX_LEVEL; i++) {
      const index = state.practice.levels[i].indexOf(exerciseId);
      if (index !== -1) {
        currentLevel = i;
        state.practice.levels[i].splice(index, 1);
        break;
      }
    }

    if (currentLevel === -1) return; // Should not happen if item was in session

    if (isCorrect) {
      const nextLevel = Math.min(currentLevel + 1, MAX_LEVEL);
      state.practice.levels[nextLevel].push(exerciseId);
    } else {
      state.practice.levels[1].push(exerciseId);
    }

    this._saveState(state);
  },

  /**
   * Identifies the next lesson the user should take.
   * Returns the first lesson that is not completed.
   * @param {Array} chapters - The list of chapters and lessons from lessons.json
   * @returns {{chapterId: string, lessonId: string, lessonName: string} | null}
   */
  getNextLesson(chapters) {
    const state = this._getState();
    for (const chapter of chapters) {
      for (const lesson of chapter.lessons) {
        if (!state.lessons[lesson.lessonId]?.completed) {
          return {
            chapterId: chapter.chapterId,
            lessonId: lesson.lessonId,
            lessonName: lesson.lessonName,
          };
        }
      }
    }
    return null;
  },

  /**
   * Returns a count of all exercises in the SRS system.
   * @returns {number}
   */
  getPracticeCount() {
    const state = this._getState();
    let count = 0;
    Object.values(state.practice.levels).forEach((levelArray) => {
      count += levelArray.length;
    });
    return count;
  },

  /**
   * Returns the level of a specific exercise.
   * @param {string} exerciseId
   * @returns {number|null}
   */
  getExerciseLevel(exerciseId) {
    const state = this._getState();
    for (let i = 1; i <= MAX_LEVEL; i++) {
      if (state.practice.levels[i].includes(exerciseId)) {
        return i;
      }
    }
    return null;
  },

  /**
   * Returns all exercises currently in the SRS system with their levels.
   * @returns {Array<{exerciseId: string, level: number}>}
   */
  getAllPracticeExercises() {
    const state = this._getState();
    const result = [];
    for (let i = 1; i <= MAX_LEVEL; i++) {
      state.practice.levels[i].forEach((exerciseId) => {
        result.push({ exerciseId, level: i });
      });
    }
    return result;
  },
};
