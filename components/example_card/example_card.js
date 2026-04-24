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
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._playBtn = this.shadowRoot.getElementById("play-audio");
    this._cantoneseEl = this.shadowRoot.querySelector(".cantonese-text");
    this._romanizationEl = this.shadowRoot.querySelector(".romanization-text");
    this._translationEl = this.shadowRoot.querySelector(".translation-text");

    this._data = {
      cantonese: "",
      romanization: "",
      translation: "",
    };
  }

  get data() {
    return this._data;
  }
  set data(val) {
    this._data = { ...this._data, ...val };
    this.update();
  }

  connectedCallback() {
    this._upgradeProperty("data");
    this._playBtn.onclick = () => this.playAudio();
    this.update();
  }

  _upgradeProperty(prop) {
    if (Object.hasOwn(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  validate() {
    const required = ["cantonese", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        console.error(
          `🚨 [ExampleCard ERROR]: Missing required data property '${prop}'!`,
        );
      }
    });
  }

  update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    const { cantonese, romanization, translation } = this._data;

    if (this._cantoneseEl) this._cantoneseEl.textContent = cantonese;
    if (this._romanizationEl) this._romanizationEl.textContent = romanization;
    if (this._translationEl) this._translationEl.textContent = translation;
  }

  playAudio() {
    const { cantonese } = this._data;
    if (cantonese) {
      speakCantonese(cantonese);
    }
  }
}

if (!customElements.get("example-card")) {
  customElements.define("example-card", ExampleCard);
}
