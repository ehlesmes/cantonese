import { Component } from "../shared/component.js";
import { Button } from "../ui/button/button.js";

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
    this.validate(data, ["primaryText"]);

    this.render(data);
    this.setupEventListeners();
  }

  render(data) {
    const { primaryText, secondaryText, primaryDisabled, secondaryDisabled } =
      data;

    this._footer = this.html("footer");

    this._secondaryBtn = new Button({
      label: secondaryText || "Secondary",
      variant: "outline",
      disabled: secondaryDisabled,
    });
    this._secondaryBtn.element.id = "secondary-btn";
    if (!secondaryText) {
      this._secondaryBtn.element.classList.add("hidden");
    }
    this._footer.appendChild(this._secondaryBtn.element);

    this._primaryBtn = new Button({
      label: primaryText,
      variant: "filled",
      disabled: primaryDisabled,
    });
    this._primaryBtn.element.id = "primary-btn";
    this._footer.appendChild(this._primaryBtn.element);

    this.shadowRoot.appendChild(this._footer);
  }

  setupEventListeners() {
    this._primaryBtn.element.addEventListener("click", () =>
      this.dispatch("primary-click"),
    );
    this._secondaryBtn.element.addEventListener("click", () =>
      this.dispatch("secondary-click"),
    );
  }

  /**
   * Primary button text. Setting to null/undefined hides the button.
   */
  get primaryText() {
    return this._primaryBtn.label;
  }

  set primaryText(text) {
    if (text) {
      this._primaryBtn.label = text;
      this._primaryBtn.element.classList.remove("hidden");
    } else {
      this._primaryBtn.element.classList.add("hidden");
    }
  }

  /**
   * Secondary button text. Setting to null/undefined hides the button.
   */
  get secondaryText() {
    return this._secondaryBtn.label;
  }

  set secondaryText(text) {
    if (text) {
      this._secondaryBtn.label = text;
      this._secondaryBtn.element.classList.remove("hidden");
    } else {
      this._secondaryBtn.element.classList.add("hidden");
    }
  }

  get primaryDisabled() {
    return this._primaryBtn.disabled;
  }

  set primaryDisabled(disabled) {
    this._primaryBtn.disabled = disabled;
  }

  get secondaryDisabled() {
    return this._secondaryBtn.disabled;
  }

  set secondaryDisabled(disabled) {
    this._secondaryBtn.disabled = disabled;
  }
}
