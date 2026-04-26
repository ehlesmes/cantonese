import { Component } from "../../shared/component.js";
import { iconStyles, buttonStyles } from "../../shared/shared_assets.js";
import { ValidationError } from "../../shared/validation_error.js";

/**
 * Button Component
 * A unified UI button that supports either a label or a Material Icon.
 */
export class Button extends Component {
  /**
   * @param {Object} data
   * @param {string} [data.label] - Text label (exclusive with icon)
   * @param {string} [data.icon] - Material Symbol name (exclusive with label)
   * @param {'filled'|'outline'} [data.variant='outline']
   * @param {boolean} [data.disabled=false]
   * @param {string} [data.title] - Optional tooltip/accessible title
   */
  constructor(data) {
    super(import.meta.url);

    this._validateButtonData(data);
    const { label, icon, variant = "outline", disabled = false, title } = data;

    this.addStyles("./style.css", import.meta.url);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];

    this._button = document.createElement("button");
    this._button.className = "btn-base";
    this._button.classList.add(buttonStyles[variant] || buttonStyles.outline);
    this._button.disabled = Boolean(disabled);

    if (title) {
      this._button.title = title;
    }

    if (icon) {
      this._button.classList.add("icon-button");
      const iconSpan = document.createElement("span");
      iconSpan.className = "material-symbols-outlined";
      iconSpan.textContent = icon;
      this._button.appendChild(iconSpan);
      if (!title) this._button.title = icon.replace(/_/g, " ");
    } else if (label) {
      this._button.classList.add("text-button");
      this._button.textContent = label;
    }

    this.shadowRoot.appendChild(this._button);

    // Sync properties to the root element for easier testing and access
    Object.defineProperty(this.element, "textContent", {
      get: () => this._button.textContent,
      set: (v) => {
        this.label = v;
      },
      configurable: true,
    });

    Object.defineProperty(this.element, "disabled", {
      get: () => this._button.disabled,
      set: (v) => {
        this.disabled = v;
      },
      configurable: true,
    });

    this._button.addEventListener("click", (e) => {
      if (this._button.disabled) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    });
  }

  _validateButtonData(data) {
    if (!data) {
      throw new ValidationError("data is undefined");
    }
    if (!data.label && !data.icon) {
      throw new ValidationError("Button must have either a label or an icon");
    }
    if (data.label && data.icon) {
      throw new ValidationError(
        "Button cannot have both a label and an icon (MVP constraint)",
      );
    }
  }

  set label(value) {
    if (this._button.querySelector(".material-symbols-outlined")) {
      this._button.innerHTML = "";
      this._button.classList.remove("icon-button");
      this._button.classList.add("text-button");
    }
    this._button.textContent = value;
  }

  set disabled(value) {
    this._button.disabled = Boolean(value);
  }

  get disabled() {
    return this._button.disabled;
  }
}
