import { iconStyles } from "/components/shared/shared_assets.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="/components/shared/button.css" />
<link rel="stylesheet" href="components/ui/icon_button/style.css" />
<button class="btn-base icon-button">
  <span class="material-symbols-outlined"><slot></slot></span>
</button>
`;

class UiIconButton extends HTMLElement {
  static get observedAttributes() {
    return ["title", "disabled", "variant"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._btn = this.shadowRoot.querySelector("button");
  }

  connectedCallback() {
    this._update();
  }

  attributeChangedCallback() {
    this._update();
  }

  _update() {
    if (!this._btn) return;
    this._btn.title = this.getAttribute("title") || "";

    if (this.hasAttribute("disabled")) {
      this._btn.setAttribute("disabled", "");
    } else {
      this._btn.removeAttribute("disabled");
    }

    // Handle variant
    const variant = this.getAttribute("variant") || "outline";
    this._btn.classList.remove("btn-filled", "btn-outline");
    this._btn.classList.add(`btn-${variant}`);
  }
}

if (!customElements.get("ui-icon-button")) {
  customElements.define("ui-icon-button", UiIconButton);
}
