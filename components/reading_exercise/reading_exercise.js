import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { IconButton } from "../ui/icon_button/icon_button.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";

/**
 * ReadingExercise Component
 * A reusable UI element for displaying reading exercises.
 */
export class ReadingExercise extends Component {
  /**
   * @param {Object} [data]
   * @param {string} [data.cantonese]
   * @param {string} [data.romanization]
   * @param {string} [data.translation]
   */
  constructor(data) {
    super(import.meta.url);
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this.validate(data, ["cantonese", "romanization", "translation"]);
    const { cantonese, romanization, translation } = data;
    this._cantonese = cantonese;

    this._container = document.createElement("div");
    this._container.className = "reading-wrapper";

    const phraseContainer = document.createElement("div");
    phraseContainer.className = "phrase-container";

    this._cantoneseEl = document.createElement("div");
    this._cantoneseEl.className = "cantonese-text";
    this._cantoneseEl.textContent = cantonese;

    this._romanizationEl = document.createElement("span");
    this._romanizationEl.className = "romanization-text";
    this._romanizationEl.textContent = romanization;

    this._tooltip = new Tooltip({
      trigger: this._cantoneseEl,
      content: this._romanizationEl,
    });

    phraseContainer.appendChild(this._tooltip.element);

    this._playBtn = new IconButton({
      title: "Play Audio",
      icon: "volume_up",
    });
    this._playBtn.element.id = "play-audio";
    phraseContainer.appendChild(this._playBtn.element);

    this._translationEl = document.createElement("div");
    this._translationEl.className = "translation-text";
    this._translationEl.textContent = translation;
    this._translationEl.classList.toggle("hidden", true);
    phraseContainer.appendChild(this._translationEl);

    this._container.appendChild(phraseContainer);
    this.shadowRoot.appendChild(this._container);

    this._playBtn.element.onclick = () => this.playAudio();
  }

  showTranslation() {
    this._translationEl.classList.toggle("hidden", false);
  }

  playAudio() {
    speakCantonese(this._cantonese);

    this.dispatch("play-audio", { phrase: this._cantonese });
  }
}
