import { Component } from "../../shared/component.js";
import { iconStyles, buttonStyles } from "../../shared/shared_assets.js";

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
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];

    this.validate(data, ["title", "icon"]);
    const { title, icon, filled, disabled } = data;

    this._disabled = disabled;

    this._button = document.createElement("button");
    this._button.title = title;
    this._button.disabled = Boolean(disabled);
    this._button.className = "btn-base icon-button";
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
}
