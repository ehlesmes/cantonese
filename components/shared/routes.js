/**
 * Central registry for all application hash routes to avoid magic strings.
 */
const registry = new Map();

export const Routes = {
  HOME: "#/home",
  VOCABULARY: "#/vocabulary",
  ADVANCED: "#/advanced",
  PRACTICE: "#/practice",

  /**
   * Generates a lesson route for a specific ID.
   * @param {string} id
   * @returns {string}
   */
  lesson: (id) => `#/lesson/${id}`,

  /**
   * Checks if a hash represents a lesson route and returns the ID.
   * @param {string} hash
   * @returns {string|null}
   */
  parseLessonId: (hash) => {
    if (hash.startsWith("#/lesson/")) {
      return hash.replace("#/lesson/", "");
    }
    return null;
  },

  /**
   * Checks if a hash is a "Focus Mode" route (lesson or practice).
   * @param {string} hash
   * @returns {boolean}
   */
  isFocusMode: (hash) => {
    return hash.startsWith("#/lesson/") || hash === "#/practice";
  },

  /**
   * Registers a component class for a specific hash route.
   * @param {string} hash
   * @param {typeof import("./component.js").Component} componentClass
   */
  register: (hash, componentClass) => {
    registry.set(hash, componentClass);
  },

  /**
   * Retrieves the component class for a specific hash route.
   * @param {string} hash
   * @returns {typeof import("./component.js").Component|undefined}
   */
  getComponent: (hash) => {
    // Exact match
    if (registry.has(hash)) {
      return registry.get(hash);
    }
    return undefined;
  },
};
