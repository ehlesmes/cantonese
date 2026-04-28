import { validateObject } from "../../schemas/validator.js";
import { Schemas } from "../../schemas/lessons.js";

/**
 * Utility to fetch and cache individual exercises.
 */
export const ExerciseProvider = {
  _cache: new Map(),

  /**
   * Fetches an exercise by its path.
   * @param {string} path - e.g., "1/1/1.1.2.json"
   * @returns {Promise<Object>}
   */
  async getExercise(path) {
    if (this._cache.has(path)) return this._cache.get(path);

    try {
      const response = await fetch(`data/exercises/${path}`);
      if (!response.ok) throw new Error(`Failed to load exercise: ${path}`);

      const data = await response.json();

      // Validate based on type
      const schema =
        data.type === "reading"
          ? Schemas.readingExercise
          : Schemas.unscrambleExercise;
      const errors = validateObject(data, schema);
      if (errors.length > 0) {
        console.error(
          `🚨 [ExerciseProvider]: Validation failed for ${path}`,
          errors,
        );
      }

      this._cache.set(path, data);
      return data;
    } catch (err) {
      console.error(`🚨 [ExerciseProvider ERROR]: ${err.message}`);
      throw err;
    }
  },

  /**
   * Prefetches a list of exercises.
   * @param {string[]} paths
   */
  prefetch(paths) {
    paths.forEach((path) => {
      if (!this._cache.has(path)) {
        this.getExercise(path).catch(() => {
          /* silence prefetch errors */
        });
      }
    });
  },
};
