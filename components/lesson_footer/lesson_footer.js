import { Component } from "/components/shared/component.js";

export class LessonFooter extends Component {
  /**
   * @param {Object} [options]
   * @param {string} [options.primaryText]
   * @param {string} [options.secondaryText]
   * @param {boolean} [options.primaryDisabled]
   * @param {boolean} [options.secondaryDisabled]
   */
  constructor(options = {}) {
    super("/components/lesson_footer/style.css");

    const baseStyle = document.createElement("link");
    baseStyle.rel = "stylesheet";
    baseStyle.href = "/components/shared/button.css";
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

    if (Object.keys(options).length > 0) {
      this.data = options;
    }
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
