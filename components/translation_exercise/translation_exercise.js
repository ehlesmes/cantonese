import { iconStyles } from "/components/shared/shared_assets.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/lesson_controls/style.css" />
<div class="translation-wrapper">
  <div class="phrase-display">
    <span class="cantonese-text"></span>
    <span class="romanization hidden"></span>
    <div class="meta-actions">
      <button id="play-audio" title="Play Audio">
        <span class="material-symbols-outlined">play_circle</span>
      </button>
      <button id="show-hint" title="Show Hint">
        <span class="material-symbols-outlined">lightbulb</span>
      </button>
    </div>
  </div>
</div>
`;

/**
 * TranslationExercise Component
 * A reusable UI element for displaying translation exercises.
 */
class TranslationExercise extends HTMLElement {
  static get observedAttributes() {
    return ["cantonese-phrase", "romanization", "translation", "audio-path"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.getElementById("play-audio").onclick = () => {
      this.dispatchEvent(
        new CustomEvent("play-audio", { bubbles: true, composed: true }),
      );
    };
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "cantonese-phrase") {
      this.shadowRoot.querySelector(".cantonese-text").textContent = newValue;
    } else if (name === "romanization") {
      this.shadowRoot.querySelector(".romanization").textContent = newValue;
    } else if (name === "translation") {
      // Store translation for hint functionality if needed later
      this.translationText = newValue;
    } else if (name === "audio-path") {
      this.shadowRoot.getElementById("play-audio").dataset.audioPath = newValue;
    }
  }

  render() {
    const phrase = this.getAttribute("cantonese-phrase") || "";
    const romanization = this.getAttribute("romanization") || "";
    const translation = this.getAttribute("translation") || "";
    const audioPath = this.getAttribute("audio-path") || "";

    // Add event listeners
    this.shadowRoot
      .getElementById("play-audio")
      .addEventListener("click", this.playAudio.bind(this));
    this.shadowRoot
      .getElementById("show-hint")
      .addEventListener("click", this.toggleHint.bind(this));
  }

  playAudio() {
    const audioPath =
      this.shadowRoot.getElementById("play-audio").dataset.audioPath;
    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.play();
    }
  }

  toggleHint() {
    const romanization = this.shadowRoot.querySelector(".romanization");
    romanization.classList.toggle("hidden");
  }
}

// Define the custom element
customElements.define("translation-exercise", TranslationExercise);
