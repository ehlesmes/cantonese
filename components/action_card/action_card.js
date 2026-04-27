import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { Button } from "../ui/button/button.js";

export class ActionCard extends Component {
  /**
   * @param {Object} data
   * @param {string} data.title
   * @param {string} data.description
   * @param {string} data.icon
   * @param {string} data.actionText
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["title", "description", "icon", "actionText"]);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];
    this.render(data);
    this.setupEventListeners();
  }

  render(data) {
    const { title, description, icon, actionText } = data;

    this._card = this.html("div", { className: "action-card" });

    const header = this.html("div", { className: "card-header" });
    const iconEl = this.html("span", {
      className: "material-symbols-outlined card-icon",
      textContent: icon,
    });
    const titleEl = this.html("h3", {
      className: "card-title",
      textContent: title,
    });

    header.appendChild(iconEl);
    header.appendChild(titleEl);
    this._card.appendChild(header);

    const descEl = this.html("p", {
      className: "card-description",
      textContent: description,
    });
    this._card.appendChild(descEl);

    const footer = this.html("div", { className: "card-footer" });
    this._actionBtn = new Button({
      label: actionText,
      variant: "filled",
    });
    footer.appendChild(this._actionBtn.element);
    this._card.appendChild(footer);

    this.shadowRoot.appendChild(this._card);
  }

  setupEventListeners() {
    this._actionBtn.element.addEventListener("click", () => {
      this.dispatch("action-click");
    });

    this._card.addEventListener("click", (e) => {
      if (e.target !== this._actionBtn.element) {
        this.dispatch("action-click");
      }
    });
  }
}
