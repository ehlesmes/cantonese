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
  }

  connectedCallback() {
    this._playBtn.onclick = () => this.playAudio();
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
    if (!this.shadowRoot) return;

    const cantonese = this.getAttribute("cantonese") || "";
    const romanization = this.getAttribute("romanization") || "";
    const translation = this.getAttribute("translation") || "";

    // Validation
    if (!cantonese || !romanization || !translation) {
      console.error(
        "🚨 [ExampleCard ERROR]: Missing required attributes (cantonese, romanization, or translation)!",
      );
    }

    if (this._cantoneseEl) this._cantoneseEl.textContent = cantonese;
    if (this._romanizationEl) this._romanizationEl.textContent = romanization;
    if (this._translationEl) this._translationEl.textContent = translation;
  }

  playAudio() {
    const cantonese = this.getAttribute("cantonese");
    if (cantonese) {
      speakCantonese(cantonese);
    }
  }
}

if (!customElements.get("example-card")) {
  customElements.define("example-card", ExampleCard);
}
