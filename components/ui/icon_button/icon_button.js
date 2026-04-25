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
  constructor(data = {}) {
    super(data, import.meta.url);

    this.addStyles("../../shared/button.css", import.meta.url);

    // Apply shared icon font styles
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._btn = document.createElement("button");
    this._btn.title = this._data.title;
    this._btn.disabled = Boolean(this._data.disabled);
    this._btn.className = "btn-base icon-button";
    this._btn.classList.add(
      this._data.filled ? buttonStyles.filled : buttonStyles.outlined,
    );

    this._iconSpan = document.createElement("span");
    this._iconSpan.textContent = this._data.icon;
    this._iconSpan.className = "material-symbols-outlined";

    this._btn.appendChild(this._iconSpan);

    this.shadowRoot.appendChild(this._btn);

    // Proxy click events from the button to the root element
    this._btn.onclick = (e) => {
      if (this._data.disabled) {
        e.stopPropagation();
        return;
      }
    };
  }

  validate() {
    const required = ["title", "icon"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        throw new ValidationError(`Missing required data property '${prop}'!`);
      }
    });
  }

  update() {
    this._btn.title = this.data.title;
    this._btn.disabled = Boolean(this.data.disabled);

    this._btn.classList.remove(buttonStyles.outline, buttonStyles.filled);
    this._btn.classList.add(
      this._data.filled ? buttonStyles.filled : buttonStyles.outline,
    );
    this._iconSpan.textContent = this._data.icon;
  }
}
