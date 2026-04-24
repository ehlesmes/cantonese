import { iconStyles } from "/components/shared/shared_assets.js";
import { speakCantonese } from "/components/shared/tts.js";
import "/components/ui/icon_button/icon_button.js";
import "/components/ui/tooltip/tooltip.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/reading_exercise/style.css" />
<div class="reading-wrapper">
  <div class="phrase-container">
    <ui-tooltip>
      <div slot="trigger" class="cantonese-text"></div>
      <span slot="content" class="romanization-text"></span>
    </ui-tooltip>
    <ui-icon-button id="play-audio" title="Play Audio">volume_up</ui-icon-button>
    <div class="translation-text"></div>
  </div>
</div>
`;

/**
 * ReadingExercise Component
 * A reusable UI element for displaying reading exercises.
 */
class ReadingExercise extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._playBtn = this.shadowRoot.getElementById("play-audio");
    this._cantoneseEl = this.shadowRoot.querySelector(".cantonese-text");
    this._romanizationEl = this.shadowRoot.querySelector(".romanization-text");
    this._translationEl = this.shadowRoot.querySelector(".translation-text");

    // Internal state
    this._data = {
      cantonesePhrase: "",
      romanization: "",
      translation: "",
      translationHidden: true,
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
    if (this.hasOwnProperty(prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  validate() {
    const required = ["cantonesePhrase", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        console.error(
          `🚨 [ReadingExercise ERROR]: Missing required data property '${prop}'!`,
        );
      }
    });
  }

  update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    const { cantonesePhrase, romanization, translation, translationHidden } =
      this._data;

    if (this._cantoneseEl) this._cantoneseEl.textContent = cantonesePhrase;
    if (this._romanizationEl) this._romanizationEl.textContent = romanization;
    if (this._translationEl) {
      this._translationEl.textContent = translation;
      this._translationEl.classList.toggle("hidden", translationHidden);
    }
  }

  playAudio() {
    const { cantonesePhrase } = this._data;
    if (!cantonesePhrase) {
      console.error(
        "🚨 [ReadingExercise ERROR]: Cannot play audio without 'cantonesePhrase'!",
      );
      return;
    }

    speakCantonese(cantonesePhrase);

    this.dispatchEvent(
      new CustomEvent("play-audio", {
        detail: { phrase: cantonesePhrase },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("reading-exercise")) {
  customElements.define("reading-exercise", ReadingExercise);
}
