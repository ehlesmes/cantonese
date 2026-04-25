import { Component } from "../../shared/component.js";
import { ValidationError } from "../../shared/validation_error.js";

export class Tooltip extends Component {
  constructor(data = {}) {
    super(data, "./style.css", import.meta.url);

    const container = document.createElement("div");
    container.className = "tooltip-container";

    container.appendChild(this._data.trigger);

    const tooltipDiv = document.createElement("div");
    tooltipDiv.className = "tooltip";

    container.appendChild(this._data.content);

    container.appendChild(tooltipDiv);

    this.shadowRoot.appendChild(container);
  }

  validate() {
    const required = ["trigger", "content"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        throw new ValidationError(`Missing required data property '${prop}'!`);
      }
    });
  }

  update(oldData) {
    oldData.trigger.replaceWith(this._data.trigger);
    oldData.content.replaceWith(this._data.content);
  }
}
