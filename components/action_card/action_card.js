import { Component } from "../shared/component.js";

export class ActionCard extends Component {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.title
   * @param {string} data.description
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["id", "title", "description"]);
    this.element.id = data.id;
    this.render(data);
    this.setupEventListeners();
  }

  render(data) {
    const { title, description } = data;

    this._card = this.html("div", { className: "action-card" });

    const header = this.html("div", { className: "card-header" });
    const titleEl = this.html("h3", {
      className: "card-title",
      textContent: title,
    });

    header.appendChild(titleEl);
    this._card.appendChild(header);

    const descEl = this.html("p", {
      className: "card-description",
      textContent: description,
    });
    this._card.appendChild(descEl);

    this.shadowRoot.appendChild(this._card);
  }

  setupEventListeners() {
    this._card.addEventListener("click", () => {
      this.dispatch("action-click");
    });
  }
}
