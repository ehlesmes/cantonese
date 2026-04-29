import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";
import { AudioControls } from "../ui/audio_controls/audio_controls.js";

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
    this._cantonese = data.cantonese;

    this.render(data);
    this.setupEventListeners();
  }

  render(data) {
    const { cantonese, romanization, translation } = data;

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

    this._audioControls = new AudioControls({
      onPlay: () => this.playAudio(),
      onPlaySlow: () => this.playAudio(0.1),
    });
    this._audioControls.element.classList.add("audio-controls");
    phraseContainer.appendChild(this._audioControls.element);

    this._translationEl = this.html("div", {
      className: "translation-text",
      textContent: translation,
    });
    this._translationEl.classList.toggle("hidden", true);
    phraseContainer.appendChild(this._translationEl);

    this._container.appendChild(phraseContainer);
    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {}

  get translationVisible() {
    return !this._translationEl.classList.contains("hidden");
  }

  set translationVisible(value) {
    this._translationEl.classList.toggle("hidden", !value);
  }

  playAudio(rate = 0.85) {
    speakCantonese(this._cantonese, { rate });

    this.dispatch("play-audio", { phrase: this._cantonese, rate });
  }
}
