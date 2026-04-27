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
    if (baseUrl) {
      this.addStyles("./style.css", baseUrl);
    }
  }

  /**
   * Standard rendering lifecycle method.
   * @param {Object} [data]
   */
  render(_data) {}

  /**
   * Helper to create elements with classes, content, and common properties.
   * @param {string} tag
   * @param {Object} [props]
   * @param {string} [props.className]
   * @param {string} [props.id]
   * @param {string} [props.textContent]
   * @param {string} [props.href]
   * @param {string} [props.title]
   * @param {string} [props.slot]
   * @param {string} [props.type]
   * @returns {HTMLElement}
   */
  html(tag, { className, id, textContent, href, title, slot, type } = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (id) el.id = id;
    if (textContent) el.textContent = textContent;
    if (href) el.href = href;
    if (title) el.title = title;
    if (slot) el.slot = slot;
    if (type) el.type = type;
    return el;
  }

  validate(data, properties = []) {
    if (!data) {
      throw new ValidationError("data is undefined");
    }
    properties.forEach((name) => {
      if (!data[name]) {
        throw new ValidationError(`Missing property: ${name}`);
      }
    });
  }

  /**
   * Syncs a property from the root element to the component instance.
   * @param {string} propertyName
   */
  proxyProperty(propertyName) {
    Object.defineProperty(this.element, propertyName, {
      get: () => this[propertyName],
      set: (v) => {
        this[propertyName] = v;
      },
      configurable: true,
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
