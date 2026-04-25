import { Component } from "../../shared/component.js";

export class Tooltip extends Component {
  constructor() {
    super({ cssPath: "./style.css", baseUrl: import.meta.url });

    const container = document.createElement("div");
    container.className = "tooltip-container";

    const triggerSlot = document.createElement("slot");
    triggerSlot.name = "trigger";
    container.appendChild(triggerSlot);

    const tooltipDiv = document.createElement("div");
    tooltipDiv.className = "tooltip";

    const contentSlot = document.createElement("slot");
    contentSlot.name = "content";
    tooltipDiv.appendChild(contentSlot);

    container.appendChild(tooltipDiv);

    this.shadowRoot.appendChild(container);
  }
}
