/**
 * Base class for all UI components.
 * Manages the root element (always a <div>), shadow DOM, and basic data updates.
 */
export class Component {
  /**
   * @param {Object} [config]
   * @param {string} [config.cssPath] - Optional path to a stylesheet relative to the component.
   * @param {string} [config.baseUrl] - Base URL to resolve relative cssPath (usually import.meta.url).
   * @param {Object} [config.data] - Initial data for the component.
   */
  constructor(config = {}) {
    this.element = document.createElement("div");
    this.shadowRoot = this.element.attachShadow({ mode: "open" });

    const { cssPath, baseUrl, data, ...rest } = config;

    if (cssPath) {
      const link = document.createElement("link");
      link.rel = "stylesheet";

      if (baseUrl && !cssPath.startsWith("/") && !cssPath.includes("://")) {
        link.href = new URL(cssPath, baseUrl).href;
      } else {
        link.href = cssPath;
      }

      this.shadowRoot.appendChild(link);
    }

    this._data = data || rest || {};
    // Subclasses should call update() at the end of their constructor
  }

  get data() {
    return this._data;
  }

  set data(val) {
    this._data = { ...this._data, ...val };
    this.update();
  }

  /**
   * To be overridden by subclasses.
   * Called whenever data is set.
   */
  update() {
    // Override in subclass
  }

  /**
   * Helper to dispatch custom events from the component's root element.
   * @param {string} eventName
   * @param {any} detail
   * @param {CustomEventInit} options
   */
  dispatch(eventName, detail = {}, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
      ...options,
    });
    this.element.dispatchEvent(event);
  }
}
