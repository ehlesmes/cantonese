import { Component } from "../../shared/component.js";
import { iconStyles } from "../../shared/shared_assets.js";

export class IconButton extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.data]
   * @param {string} [config.data.title]
   * @param {boolean} [config.data.disabled]
   * @param {"filled"|"outline"} [config.data.variant]
   * @param {string} [config.data.icon]
   */
  constructor(config = {}) {
    super({ cssPath: "./style.css", baseUrl: import.meta.url, ...config });

    // Add base button styles
    const baseStyle = document.createElement("link");
    baseStyle.rel = "stylesheet";
    baseStyle.href = new URL("../../shared/button.css", import.meta.url).href;
    this.shadowRoot.appendChild(baseStyle);

    // Apply shared icon font styles
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._btn = document.createElement("button");
    this._btn.className = "btn-base icon-button";

    const iconSpan = document.createElement("span");
    iconSpan.className = "material-symbols-outlined";

    const slot = document.createElement("slot");
    iconSpan.appendChild(slot);
    this._btn.appendChild(iconSpan);

    this.shadowRoot.appendChild(this._btn);

    // Proxy click events from the button to the root element
    this._btn.onclick = (e) => {
      if (this._data.disabled) {
        e.stopPropagation();
        return;
      }
    };

    this.update();
  }

  update() {
    const { title, disabled, variant = "outline", icon } = this._data;

    if (this._btn) {
      this._btn.title = title || "";
      if (disabled) {
        this._btn.disabled = true;
      } else {
        this._btn.disabled = false;
      }

      this._btn.classList.remove("btn-filled", "btn-outline");
      this._btn.classList.add(`btn-${variant}`);
    }

    if (icon && this.element.textContent !== icon) {
      this.element.textContent = icon;
    }
  }
}
