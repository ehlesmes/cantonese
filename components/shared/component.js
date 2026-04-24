/**
 * Base class for all UI components.
 * Manages the root element, shadow DOM, and basic data updates.
 */
export class Component {
  /**
   * @param {string} [cssPath] - Optional path to a stylesheet to load in the shadow DOM.
   * @param {string} [tagName="div"] - The tag name for the root element.
   */
  constructor(cssPath, tagName = "div") {
    this.element = document.createElement(tagName);
    this.shadowRoot = this.element.attachShadow({ mode: "open" });

    if (cssPath) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      this.shadowRoot.appendChild(link);
    }

    this._data = {};
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
