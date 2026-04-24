import { Component } from "/components/shared/component.js";
import { iconStyles } from "/components/shared/shared_assets.js";

export class IconButton extends Component {
  /**
   * @param {Object} [options]
   * @param {string} [options.title]
   * @param {boolean} [options.disabled]
   * @param {"filled"|"outline"} [options.variant]
   * @param {string} [options.icon]
   */
  constructor(options = {}) {
    super("/components/ui/icon_button/style.css");

    // Add base button styles
    const baseStyle = document.createElement("link");
    baseStyle.rel = "stylesheet";
    baseStyle.href = "/components/shared/button.css";
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

    if (options.icon) {
      this.element.textContent = options.icon;
    }

    this.data = options;

    // Proxy click events from the button to the root element
    this._btn.onclick = (e) => {
      if (this._data.disabled) {
        e.stopPropagation();
        return;
      }
      // The original click event will still bubble, but we might want to ensure it's clean
    };
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
