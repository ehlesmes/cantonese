import { validateObject } from "../../schemas/validator.js";
import { Schemas } from "../../schemas/lessons.js";

/**
 * Utility to fetch and cache lesson manifests and detail data.
 */
export const LessonProvider = {
  _manifestCache: null,
  _manifestPromise: null,
  _lessonCache: new Map(),

  /**
   * Loads the lessons.json manifest.
   * @returns {Promise<Object>}
   */
  async getManifest() {
    if (this._manifestCache) return this._manifestCache;
    if (this._manifestPromise) return this._manifestPromise;

    this._manifestPromise = fetch("data/lessons.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load lessons.json");
        return res.json();
      })
      .then((data) => {
        const errors = validateObject(data, Schemas.lessonsJson);
        if (errors.length > 0) {
          console.error("🚨 [LessonProvider]: Validation failed for lessons.json", errors);
        }
        this._manifestCache = data;
        this._manifestPromise = null;
        return data;
      })
      .catch((err) => {
        this._manifestPromise = null;
        throw err;
      });

    return this._manifestPromise;
  },

  /**
   * Fetches the detail data for a specific lesson.
   * @param {string} lessonId
   * @returns {Promise<Object>}
   */
  async getLessonData(lessonId) {
    if (this._lessonCache.has(lessonId)) return this._lessonCache.get(lessonId);

    const [chapter] = lessonId.split(".");
    try {
      const response = await fetch(`data/lessons/${chapter}/${lessonId}.json`);
      if (!response.ok) throw new Error(`Failed to load lesson: ${lessonId}`);

      const data = await response.json();
      const errors = validateObject(data, Schemas.lessonDetail);
      if (errors.length > 0) {
        console.error(`🚨 [LessonProvider]: Validation failed for ${lessonId}.json`, errors);
      }

      this._lessonCache.set(lessonId, data);
      return data;
    } catch (err) {
      console.error(`🚨 [LessonProvider ERROR]: ${err.message}`);
      throw err;
    }
  },

  /**
   * Resolves a lesson name from its ID.
   * @param {string} lessonId
   * @returns {Promise<string>}
   */
  async getLessonName(lessonId) {
    const data = await this.getManifest();
    for (const chapter of data.chapters) {
      const lesson = chapter.lessons.find((l) => l.lessonId === lessonId);
      if (lesson) return lesson.lessonName;
    }
    return "Unknown Lesson";
  },
};
