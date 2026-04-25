/**
 * Base class for all UI components.
 * Manages the root element (always a <div>), shadow DOM, and basic data updates.
 */
export class Component {
  /**
   * @param {Object} [data] - Initial data for the component.
   * @param {string} [cssPath] - Optional path to a stylesheet relative to the component.
   * @param {string} [baseUrl] - Base URL to resolve relative cssPath (usually import.meta.url).
   */
  constructor(data, baseUrl) {
    this.element = document.createElement("div");
    this.shadowRoot = this.element.attachShadow({ mode: "open" });
    this.addStyles("./styles.css", baseUrl);

    this._data = data;
    this.validate();
  }

  addStyles(cssPath, baseUrl) {
    const link = document.createElement("link");
    link.rel = "stylesheet";

    if (baseUrl && !cssPath.startsWith("/") && !cssPath.includes("://")) {
      link.href = new URL(cssPath, baseUrl).href;
    } else {
      link.href = cssPath;
    }
    this.shadowRoot.appendChild(link);
  }

  get data() {
    return this._data;
  }

  set data(val) {
    const oldData = this._data;
    this._data = { ...this._data, ...val };
    this.validate();
    this.update(oldData);
  }

  /**
   * To be overridden by subclasses.
   * Called whenever data is set.
   */
  validate() {
    // Override in subclass.
  }

  /**
   * To be overridden by subclasses.
   * Called whenever data is set.
   */
  update(_oldData) {
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
