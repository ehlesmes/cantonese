import { Component } from "../shared/component.js";

export class LessonFooter extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.data]
   * @param {string} [config.data.primaryText]
   * @param {string} [config.data.secondaryText]
   * @param {boolean} [config.data.primaryDisabled]
   * @param {boolean} [config.data.secondaryDisabled]
   */
  constructor(config = {}) {
    super({ cssPath: "./style.css", baseUrl: import.meta.url, ...config });

    const baseStyle = document.createElement("link");
    baseStyle.rel = "stylesheet";
    baseStyle.href = new URL("../shared/button.css", import.meta.url).href;
    this.shadowRoot.appendChild(baseStyle);

    this._footer = document.createElement("footer");

    this._secondaryBtn = document.createElement("button");
    this._secondaryBtn.id = "secondary-btn";
    this._secondaryBtn.className = "btn-base btn-outline hidden";
    this._footer.appendChild(this._secondaryBtn);

    this._primaryBtn = document.createElement("button");
    this._primaryBtn.id = "primary-btn";
    this._primaryBtn.className = "btn-base btn-filled";
    this._footer.appendChild(this._primaryBtn);

    this.shadowRoot.appendChild(this._footer);

    this._primaryBtn.onclick = () => this.dispatch("primary-click");
    this._secondaryBtn.onclick = () => this.dispatch("secondary-click");

    this.update();
  }

  validate() {
    if (!this._data.primaryText) {
      console.error(
        "🚨 [LessonFooter ERROR]: Missing required data property 'primaryText'!",
      );
    }
  }

  update() {
    this.validate();

    const { primaryText, secondaryText, primaryDisabled, secondaryDisabled } =
      this._data;

    this._primaryBtn.textContent = primaryText || "Next";
    this._primaryBtn.disabled = Boolean(primaryDisabled);

    if (secondaryText) {
      this._secondaryBtn.textContent = secondaryText;
      this._secondaryBtn.classList.remove("hidden");
      this._secondaryBtn.disabled = Boolean(secondaryDisabled);
    } else {
      this._secondaryBtn.classList.add("hidden");
    }
  }
}
