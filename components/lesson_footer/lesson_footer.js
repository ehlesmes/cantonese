import { Component } from "../shared/component.js";

export class LessonFooter extends Component {
  /**
   * @param {Object} [data]
   * @param {string} [data.primaryText]
   * @param {string} [data.secondaryText]
   * @param {boolean} [data.primaryDisabled]
   * @param {boolean} [data.secondaryDisabled]
   */
  constructor(data) {
    super(import.meta.url);

    this.addStyles("../shared/button.css", import.meta.url);

    this.validate(data, ["primaryText"]);
    const { primaryText, secondaryText, primaryDisabled, secondaryDisabled } =
      data;

    this._footer = document.createElement("footer");

    this._secondaryBtn = document.createElement("button");
    this._secondaryBtn.id = "secondary-btn";
    this._secondaryBtn.className = "btn-base btn-outline";
    if (secondaryText) {
      this._secondaryBtn.textContent = secondaryText;
      this._secondaryBtn.disabled = Boolean(secondaryDisabled);
    } else {
      this._secondaryBtn.classList.add("hidden");
    }
    this._footer.appendChild(this._secondaryBtn);

    this._primaryBtn = document.createElement("button");
    this._primaryBtn.id = "primary-btn";
    this._primaryBtn.className = "btn-base btn-filled";
    this._primaryBtn.textContent = primaryText;
    this._primaryBtn.disabled = Boolean(primaryDisabled);
    this._footer.appendChild(this._primaryBtn);

    this.shadowRoot.appendChild(this._footer);

    this._primaryBtn.onclick = () => this.dispatch("primary-click");
    this._secondaryBtn.onclick = () => this.dispatch("secondary-click");
  }

  /**
   * Updates the primary button text and visibility.
   * @param {string|null} text - The button text. If null/undefined, the button is hidden.
   */
  setPrimary(text) {
    if (text) {
      this._primaryBtn.textContent = text;
      this._primaryBtn.classList.remove("hidden");
    } else {
      this._primaryBtn.classList.add("hidden");
    }
  }

  /**
   * Updates the secondary button text and visibility.
   * @param {string|null} text - The button text. If null/undefined, the button is hidden.
   */
  setSecondary(text) {
    if (text) {
      this._secondaryBtn.textContent = text;
      this._secondaryBtn.classList.remove("hidden");
    } else {
      this._secondaryBtn.classList.add("hidden");
    }
  }

  /**
   * Sets the primary button's disabled state.
   * @param {boolean} disabled
   */
  setPrimaryDisabled(disabled) {
    this._primaryBtn.disabled = Boolean(disabled);
  }

  /**
   * Sets the secondary button's disabled state.
   * @param {boolean} disabled
   */
  setSecondaryDisabled(disabled) {
    this._secondaryBtn.disabled = Boolean(disabled);
  }
}
