import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { IconButton } from "../ui/icon_button/icon_button.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";
import { ValidationError } from "../shared/validation_error.js";

/**
 * ReadingExercise Component
 * A reusable UI element for displaying reading exercises.
 */
export class ReadingExercise extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.data]
   * @param {string} [config.data.cantonesePhrase]
   * @param {string} [config.data.romanization]
   * @param {string} [config.data.translation]
   * @param {boolean} [config.data.translationHidden]
   */
  constructor(config = {}) {
    super(config, import.meta.url);
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._container = document.createElement("div");
    this._container.className = "reading-wrapper";

    const phraseContainer = document.createElement("div");
    phraseContainer.className = "phrase-container";

    this._cantoneseEl = document.createElement("div");
    this._cantoneseEl.className = "cantonese-text";

    this._romanizationEl = document.createElement("span");
    this._romanizationEl.className = "romanization-text";

    this._tooltip = new Tooltip({
      trigger: this._cantoneseEl,
      content: this._romanizationEl,
    });
    this._tooltip.element.id = "tooltip";

    phraseContainer.appendChild(this._tooltip.element);

    this._playBtn = new IconButton({
      title: "Play Audio",
      icon: "volume_up",
    });
    this._playBtn.element.id = "play-audio";
    phraseContainer.appendChild(this._playBtn.element);

    this._translationEl = document.createElement("div");
    this._translationEl.className = "translation-text";
    phraseContainer.appendChild(this._translationEl);

    this._container.appendChild(phraseContainer);
    this.shadowRoot.appendChild(this._container);

    this._playBtn.element.onclick = () => this.playAudio();

    if (this._data.translationHidden === undefined) {
      this._data.translationHidden = true;
    }

    this.update();
  }

  validate() {
    const required = ["cantonesePhrase", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        throw new ValidationError(
          `🚨 [ReadingExercise ERROR]: Missing required data property '${prop}'!`,
        );
      }
    });
  }

  update() {
    const { cantonesePhrase, romanization, translation, translationHidden } =
      this._data;

    this._cantoneseEl.textContent = cantonesePhrase;
    this._romanizationEl.textContent = romanization;
    this._translationEl.textContent = translation;
    this._translationEl.classList.toggle("hidden", Boolean(translationHidden));
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

    this.dispatch("play-audio", { phrase: cantonesePhrase });
  }
}
