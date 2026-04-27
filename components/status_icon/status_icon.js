import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";

export class StatusIcon extends Component {
  /**
   * @param {Object} data
   * @param {'not-started' | 'in-progress' | 'completed'} data.status
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["status"]);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];
    this.render();
    this.status = data.status;
  }

  render() {
    this._icon = this.html("span", {
      className: "material-symbols-outlined status-icon",
    });

    this.shadowRoot.appendChild(this._icon);
  }

  get status() {
    return this._status;
  }

  set status(value) {
    this._status = value;
    const iconMap = {
      completed: "check_circle",
      "in-progress": "incomplete_circle",
      "not-started": "circle",
    };

    this._icon.className = `material-symbols-outlined status-icon ${value}`;
    this._icon.textContent = iconMap[value] || iconMap["not-started"];
  }
}
