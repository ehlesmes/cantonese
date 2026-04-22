const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/ui/tooltip/style.css" />
<div class="tooltip-container">
  <slot name="trigger"></slot>
  <div class="tooltip">
    <slot name="content"></slot>
  </div>
</div>
`;

class UiTooltip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

if (!customElements.get("ui-tooltip")) {
  customElements.define("ui-tooltip", UiTooltip);
}
