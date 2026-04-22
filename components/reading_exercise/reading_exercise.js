import { iconStyles } from "/components/shared/shared_assets.js";
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
      "audio-path",
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
  }

  connectedCallback() {
    this._playBtn.onclick = () => this.playAudio();
    
    // Set default hidden state if attribute is missing
    if (!this.hasAttribute("translation-hidden")) {
      this.setAttribute("translation-hidden", "true");
    }
    
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
    if (!this.shadowRoot) return;

    const phrase = this.getAttribute("cantonese-phrase") || "";
    const romanization = this.getAttribute("romanization") || "";
    const translation = this.getAttribute("translation") || "";
    const audioPath = this.getAttribute("audio-path") || "";
    const isHidden = this.getAttribute("translation-hidden") !== "false";

    // Required Attributes Validation
    const required = {
      "cantonese-phrase": phrase,
      "romanization": romanization,
      "translation": translation,
      "audio-path": audioPath,
    };

    Object.entries(required).forEach(([attr, val]) => {
      if (!val) {
        console.error(
          `🚨 [ReadingExercise ERROR]: Missing required attribute '${attr}'!`
        );
      }
    });

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
    this._audioPath = audioPath;
  }

  playAudio() {
    if (!this._audioPath) {
      console.error(
        "🚨 [ReadingExercise ERROR]: Missing 'audio-path' attribute! " +
        "Audio cannot play without a valid file source."
      );
      return;
    }

    const audio = new Audio(this._audioPath);
    audio.play().catch(e => {
      console.error(
        `🚨 [ReadingExercise ERROR]: Failed to play audio at '${this._audioPath}'. ` +
        "Check if the file exists and the path is correct.", e
      );
    });

    this.dispatchEvent(
      new CustomEvent("play-audio", {
        detail: { audioPath: this._audioPath },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("reading-exercise")) {
  customElements.define("reading-exercise", ReadingExercise);
}
