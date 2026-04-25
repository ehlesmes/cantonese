import { Component } from "../shared/component.js";
import { ValidationError } from "../shared/validation_error.js";

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
    super(config, import.meta.url);
    this.addStyles("../shared/button.css", import.meta.url);

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
      throw new ValidationError(
        "Missing required data property 'primaryText'!",
      );
    }
  }

  update() {
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
