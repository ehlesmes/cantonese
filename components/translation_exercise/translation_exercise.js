import { iconStyles } from "/components/shared/shared_assets.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/translation_exercise/style.css" />
<div class="translation-wrapper">
  <div class="phrase-container">
    <button class="cantonese-button" aria-label="Play audio and toggle translation">
      <span class="cantonese-text"></span>
      <span class="tooltip"></span>
    </button>
    <div class="translation-text"></div>
  </div>
</div>
`;

/**
 * TranslationExercise Component
 * A reusable UI element for displaying translation exercises.
 */
class TranslationExercise extends HTMLElement {
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

    this._btn = this.shadowRoot.querySelector(".cantonese-button");
    this._cantoneseEl = this.shadowRoot.querySelector(".cantonese-text");
    this._tooltipEl = this.shadowRoot.querySelector(".tooltip");
    this._translationEl = this.shadowRoot.querySelector(".translation-text");
  }

  connectedCallback() {
    this._btn.onclick = () => {
      this.playAudio();
    };
    
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

    if (this._cantoneseEl) this._cantoneseEl.textContent = phrase;
    if (this._tooltipEl) this._tooltipEl.textContent = romanization;
    if (this._translationEl) {
      this._translationEl.textContent = translation;
      if (isHidden) {
        this._translationEl.classList.add("hidden");
      } else {
        this._translationEl.classList.remove("hidden");
      }
    }
    if (this._btn) this._btn.dataset.audioPath = audioPath;
  }

  playAudio() {
    const audioPath = this._btn.dataset.audioPath;
    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.play();
    }
    this.dispatchEvent(
      new CustomEvent("play-audio", {
        detail: { audioPath },
        bubbles: true,
        composed: true,
      }),
    );
  }

  toggleTranslation() {
    const isHidden = this.getAttribute("translation-hidden") !== "false";
    this.setAttribute("translation-hidden", isHidden ? "false" : "true");
  }
}

if (!customElements.get("translation-exercise")) {
  customElements.define("translation-exercise", TranslationExercise);
}
