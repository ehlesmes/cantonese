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
    const { primaryText, secondaryText, primaryDisabled, secondaryDisabled } =
      data;

    this._footer = document.createElement("footer");

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

    this._primaryBtn.element.addEventListener("click", () =>
      this.dispatch("primary-click"),
    );
    this._secondaryBtn.element.addEventListener("click", () =>
      this.dispatch("secondary-click"),
    );
  }

  /**
   * Updates the primary button text and visibility.
   * @param {string|null} text - The button text. If null/undefined, the button is hidden.
   */
  setPrimary(text) {
    if (text) {
      this._primaryBtn.label = text;
      this._primaryBtn.element.classList.remove("hidden");
    } else {
      this._primaryBtn.element.classList.add("hidden");
    }
  }

  /**
   * Updates the secondary button text and visibility.
   * @param {string|null} text - The button text. If null/undefined, the button is hidden.
   */
  setSecondary(text) {
    if (text) {
      this._secondaryBtn.label = text;
      this._secondaryBtn.element.classList.remove("hidden");
    } else {
      this._secondaryBtn.element.classList.add("hidden");
    }
  }

  /**
   * Sets the primary button's disabled state.
   * @param {boolean} disabled
   */
  setPrimaryDisabled(disabled) {
    this._primaryBtn.disabled = disabled;
  }

  /**
   * Sets the secondary button's disabled state.
   * @param {boolean} disabled
   */
  setSecondaryDisabled(disabled) {
    this._secondaryBtn.disabled = disabled;
  }
}
