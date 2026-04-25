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

    this.addStyles("../shared/button.css");

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
}
