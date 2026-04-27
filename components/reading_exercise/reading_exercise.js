import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { Button } from "../ui/button/button.js";
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
    this.validate(data, ["cantonese", "romanization", "translation"]);
    this._data = data;

    this.render();
    this.setupEventListeners();
  }

  render() {
    const { cantonese, romanization, translation } = this._data;

    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];

    this._container = this.html("div", { className: "reading-wrapper" });

    const phraseContainer = this.html("div", { className: "phrase-container" });

    this._cantoneseEl = this.html("div", {
      className: "cantonese-text",
      textContent: cantonese,
    });

    this._romanizationEl = this.html("span", {
      className: "romanization-text",
      textContent: romanization,
    });

    this._tooltip = new Tooltip({
      trigger: this._cantoneseEl,
      content: this._romanizationEl,
    });

    phraseContainer.appendChild(this._tooltip.element);

    this._playBtn = new Button({
      title: "Play Audio",
      icon: "volume_up",
    });
    this._playBtn.element.id = "play-audio";
    phraseContainer.appendChild(this._playBtn.element);

    this._translationEl = this.html("div", {
      className: "translation-text",
      textContent: translation,
    });
    this._translationEl.classList.toggle("hidden", true);
    phraseContainer.appendChild(this._translationEl);

    this._container.appendChild(phraseContainer);
    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {
    this._playBtn.element.addEventListener("click", () => this.playAudio());
  }

  showTranslation() {
    this._translationEl.classList.toggle("hidden", false);
  }

  playAudio() {
    speakCantonese(this._data.cantonese);

    this.dispatch("play-audio", { phrase: this._data.cantonese });
  }
}
