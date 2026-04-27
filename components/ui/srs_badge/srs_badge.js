import { Component } from "../../shared/component.js";

export class SrsBadge extends Component {
  /**
   * @param {Object} data
   * @param {number} data.level - SRS level (1-10)
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["level"]);
    this._level = data.level;

    this.render();
  }

  render() {
    const badge = this.html("div", {
      className: `badge level-${this._level}`,
      textContent: this._level,
    });

    this.shadowRoot.appendChild(badge);
  }

  set level(value) {
    this._level = value;
    const badge = this.shadowRoot.querySelector(".badge");
    if (badge) {
      badge.className = `badge level-${value}`;
      badge.textContent = value;
    }
  }

  get level() {
    return this._level;
  }
}
