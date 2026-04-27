/**
 * Utility to fetch and cache the global lesson manifest.
 */
export const LessonProvider = {
  _cache: null,
  _loadPromise: null,

  /**
   * Loads the lessons.json manifest if not already loaded.
   * @returns {Promise<Object>}
   */
  async _load() {
    if (this._cache) return this._cache;
    if (this._loadPromise) return this._loadPromise;

    this._loadPromise = fetch("data/lessons.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load lessons.json");
        return res.json();
      })
      .then((data) => {
        this._cache = data;
        this._loadPromise = null;
        return data;
      })
      .catch((err) => {
        this._loadPromise = null;
        throw err;
      });

    return this._loadPromise;
  },

  /**
   * Resolves a lesson name from its ID.
   * @param {string} lessonId
   * @returns {Promise<string>}
   */
  async getLessonName(lessonId) {
    const data = await this._load();
    for (const chapter of data.chapters) {
      const lesson = chapter.lessons.find((l) => l.lessonId === lessonId);
      if (lesson) return lesson.lessonName;
    }
    return "Unknown Lesson";
  },
};
