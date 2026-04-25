import { Component } from "../../shared/component.js";

export class Tooltip extends Component {
  constructor(data) {
    super(import.meta.url);

    this.validate(data, ["trigger", "content"]);

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

    data.trigger.slot = "trigger";
    data.content.slot = "content";

    this.element.appendChild(data.trigger);
    this.element.appendChild(data.content);
  }
}
