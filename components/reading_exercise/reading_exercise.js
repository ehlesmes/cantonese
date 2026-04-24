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
    this._cantonesePhrase = "";
    this._romanization = "";
    this._translation = "";
    this._translationHidden = true;
  }

  // Property Getters/Setters
  get cantonesePhrase() {
    return this._cantonesePhrase;
  }
  set cantonesePhrase(val) {
    this._cantonesePhrase = val || "";
    this.update();
  }

  get romanization() {
    return this._romanization;
  }
  set romanization(val) {
    this._romanization = val || "";
    this.update();
  }

  get translation() {
    return this._translation;
  }
  set translation(val) {
    this._translation = val || "";
    this.update();
  }

  get translationHidden() {
    return this._translationHidden;
  }
  set translationHidden(val) {
    this._translationHidden = !!val;
    this.update();
  }

  connectedCallback() {
    this._playBtn.onclick = () => this.playAudio();
    this.update();
  }

  validate() {
    const required = {
      cantonesePhrase: this._cantonesePhrase,
      romanization: this._romanization,
      translation: this._translation,
    };

    Object.entries(required).forEach(([prop, val]) => {
      if (!val) {
        console.error(
          `🚨 [ReadingExercise ERROR]: Missing required property '${prop}'!`,
        );
      }
    });
  }

  update() {
    if (!this.shadowRoot) return;

    // Only validate if we are in the DOM to avoid noise during construction
    if (this.isConnected) {
      this.validate();
    }

    if (this._cantoneseEl)
      this._cantoneseEl.textContent = this._cantonesePhrase;
    if (this._romanizationEl)
      this._romanizationEl.textContent = this._romanization;
    if (this._translationEl) {
      this._translationEl.textContent = this._translation;
      this._translationEl.classList.toggle("hidden", this._translationHidden);
    }
  }

  playAudio() {
    if (!this._cantonesePhrase) {
      console.error(
        "🚨 [ReadingExercise ERROR]: Cannot play audio without 'cantonesePhrase'!",
      );
      return;
    }

    speakCantonese(this._cantonesePhrase);

    this.dispatchEvent(
      new CustomEvent("play-audio", {
        detail: { phrase: this._cantonesePhrase },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("reading-exercise")) {
  customElements.define("reading-exercise", ReadingExercise);
}
