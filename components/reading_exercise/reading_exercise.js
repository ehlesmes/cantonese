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
  static get observedAttributes() {
    return [
      "cantonese-phrase",
      "romanization",
      "translation",
      "translation-hidden",
    ];
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
    this.setAttribute("cantonese-phrase", this._cantonesePhrase);
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

  get translationHidden() {
    return this._translationHidden;
  }
  set translationHidden(val) {
    this._translationHidden = !!val;
    if (this._translationHidden) {
      this.setAttribute("translation-hidden", "true");
    } else {
      this.setAttribute("translation-hidden", "false");
    }
    this.update();
  }

  connectedCallback() {
    this._playBtn.onclick = () => this.playAudio();

    if (!this.hasAttribute("translation-hidden")) {
      this.translationHidden = true;
    }

    this.update();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    switch (name) {
      case "cantonese-phrase":
        this._cantonesePhrase = newVal || "";
        break;
      case "romanization":
        this._romanization = newVal || "";
        break;
      case "translation":
        this._translation = newVal || "";
        break;
      case "translation-hidden":
        this._translationHidden = newVal !== "false";
        break;
    }
    this.update();
  }

  update() {
    if (!this.shadowRoot) return;

    const phrase = this._cantonesePhrase;
    const romanization = this._romanization;
    const translation = this._translation;
    const isHidden = this._translationHidden;

    if (this._cantoneseEl) this._cantoneseEl.textContent = phrase;
    if (this._romanizationEl) this._romanizationEl.textContent = romanization;
    if (this._translationEl) {
      this._translationEl.textContent = translation;
      if (isHidden) {
        this._translationEl.classList.add("hidden");
      } else {
        this._translationEl.classList.remove("hidden");
      }
    }
  }

  playAudio() {
    const phrase = this._cantonesePhrase;
    if (!phrase) {
      console.error(
        "🚨 [ReadingExercise ERROR]: Cannot play audio without 'cantonese-phrase'!",
      );
      return;
    }

    speakCantonese(phrase);

    this.dispatchEvent(
      new CustomEvent("play-audio", {
        detail: { phrase },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("reading-exercise")) {
  customElements.define("reading-exercise", ReadingExercise);
}
