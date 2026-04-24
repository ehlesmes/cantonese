import { iconStyles } from "/components/shared/shared_assets.js";
import { speakCantonese } from "/components/shared/tts.js";
import "/components/ui/icon_button/icon_button.js";
import "/components/ui/tooltip/tooltip.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/example_card/style.css" />
<div class="example-wrapper">
  <div class="example-label">Example</div>
  <div class="content-row">
    <ui-tooltip>
      <div slot="trigger" class="cantonese-text"></div>
      <span slot="content" class="romanization-text"></span>
    </ui-tooltip>
    <ui-icon-button id="play-audio" title="Listen">volume_up</ui-icon-button>
  </div>
  <div class="translation-text"></div>
</div>
`;

class ExampleCard extends HTMLElement {
  static get observedAttributes() {
    return ["cantonese", "romanization", "translation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._playBtn = this.shadowRoot.getElementById("play-audio");
    this._cantoneseEl = this.shadowRoot.querySelector(".cantonese-text");
    this._romanizationEl = this.shadowRoot.querySelector(".romanization-text");
    this._translationEl = this.shadowRoot.querySelector(".translation-text");

    this._cantonese = "";
    this._romanization = "";
    this._translation = "";
  }

  get cantonese() {
    return this._cantonese;
  }
  set cantonese(val) {
    this._cantonese = val || "";
    this.setAttribute("cantonese", this._cantonese);
    this.update();
  }

  get romanization() {
    return this._romanization;
  }
  set romanization(val) {
    this._romanization = val || "";
    this.setAttribute("romanization", this._romanization);
    this.update();
  }

  get translation() {
    return this._translation;
  }
  set translation(val) {
    this._translation = val || "";
    this.setAttribute("translation", this._translation);
    this.update();
  }

  connectedCallback() {
    this._playBtn.onclick = () => this.playAudio();
    this.update();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (name) {
      case "cantonese":
        this._cantonese = newVal || "";
        break;
      case "romanization":
        this._romanization = newVal || "";
        break;
      case "translation":
        this._translation = newVal || "";
        break;
    }
    this.update();
  }

  update() {
    if (!this.shadowRoot) return;

    if (this._cantoneseEl) this._cantoneseEl.textContent = this._cantonese;
    if (this._romanizationEl)
      this._romanizationEl.textContent = this._romanization;
    if (this._translationEl)
      this._translationEl.textContent = this._translation;
  }

  playAudio() {
    if (this._cantonese) {
      speakCantonese(this._cantonese);
    }
  }
}

if (!customElements.get("example-card")) {
  customElements.define("example-card", ExampleCard);
}
