import { Component } from "../../shared/component.js";
import { iconStyles, buttonStyles } from "../../shared/shared_assets.js";
import { ValidationError } from "../../shared/validation_error.js";

export class IconButton extends Component {
  /**
   * @param {Object} [data]
   * @param {string} [data.title]
   * @param {string} [data.icon]
   * @param {boolean} [data.filled]
   * @param {boolean} [data.disabled]
   */
  constructor(data) {
    super(import.meta.url);

    this.addStyles("../../shared/button.css", import.meta.url);

    // Apply shared icon font styles
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    const {title, icon, filled, disabled} = this.validate(data);

    this._disabled = disabled;

    this._button = document.createElement("button");
    this._button.title = title;
    this._button.disabled = Boolean(disabled);
    this._button.className = "button-base icon-button";
    this._button.classList.add(
      filled ? buttonStyles.filled : buttonStyles.outline,
    );

    this._iconSpan = document.createElement("span");
    this._iconSpan.textContent = icon;
    this._iconSpan.className = "material-symbols-outlined";

    this._button.appendChild(this._iconSpan);

    this.shadowRoot.appendChild(this._button);

    // Proxy click events from the button to the root element
    this._button.onclick = (e) => {
      if (this._data.disabled) {
        e.stopPropagation();
        return;
      }
    };
  }

  validate(data) {
    const required = ["title", "icon"];
    required.forEach((prop) => {
      if (!data[prop]) {
        throw new ValidationError(`Missing required data property '${prop}'!`);
      }
    });
    return data;
  }
}
