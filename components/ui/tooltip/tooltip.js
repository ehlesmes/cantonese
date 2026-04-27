import { Component } from "../../shared/component.js";

export class Tooltip extends Component {
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["trigger", "content"]);
    this._data = data;

    this.render();
  }

  render() {
    const { trigger, content } = this._data;

    const container = this.html("div", { className: "tooltip-container" });

    const triggerSlot = this.html("slot");
    triggerSlot.name = "trigger";
    container.appendChild(triggerSlot);

    const tooltipDiv = this.html("div", { className: "tooltip" });

    const contentSlot = this.html("slot");
    contentSlot.name = "content";
    tooltipDiv.appendChild(contentSlot);

    container.appendChild(tooltipDiv);

    this.shadowRoot.appendChild(container);

    trigger.slot = "trigger";
    content.slot = "content";

    this.element.appendChild(trigger);
    this.element.appendChild(content);
  }
}
