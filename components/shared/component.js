import { baseStyles } from "./shared_assets.js";
import { ValidationError } from "./validation_error.js";

/**
 * Base class for all UI components.
 * Manages the root element (always a <div>), shadow DOM, and basic data updates.
 */
export class Component {
  /**
   * @param {string} [baseUrl] - Base URL to resolve relative cssPath (usually import.meta.url).
   */
  constructor(baseUrl) {
    this.element = document.createElement("div");
    this.shadowRoot = this.element.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [baseStyles];
    this.addStyles("./style.css", baseUrl);
  }

  validate(data, properties) {
    if (!data) {
      throw new ValidationError("data is undefined");
    }
    properties.forEach((name) => {
      if (!data[name]) {
        throw new ValidationError(`Missing property: ${name}`);
      }
    });
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

  querySelector(selector) {
    return this.shadowRoot.querySelector(selector);
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
