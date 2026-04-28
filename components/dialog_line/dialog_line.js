import { Component } from "../shared/component.js";
import { speakCantonese } from "../shared/tts.js";
import { Button } from "../ui/button/button.js";

/**
 * DialogLine Component
 * Displays a single line of a dialog with audio support.
 */
export class DialogLine extends Component {
  /**
   * @param {Object} data
   * @param {string} data.speaker
   * @param {string} data.cantonese
   * @param {string} data.romanization
   * @param {string} data.translation
   * @param {Object} voiceConfig
   * @param {number} speakerIndex
   */
  constructor(data, voiceConfig, speakerIndex) {
    super(import.meta.url);
    this.validate(data, [
      "speaker",
      "cantonese",
      "romanization",
      "translation",
    ]);

    this._data = data;
    this._voiceConfig = voiceConfig;
    this._speakerIndex = speakerIndex;

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.replaceChildren();
    this.addStyles("./style.css", import.meta.url);

    this.element.setAttribute("speaker-index", this._speakerIndex);

    const container = this.html("div", { className: "line-container" });

    const speaker = this.html("div", {
      className: "speaker-name",
      textContent: this._data.speaker,
    });

    const textRow = this.html("div", { className: "text-row" });
    const content = this.html("div", { className: "content" });

    const cantonese = this.html("div", {
      className: "cantonese",
      textContent: this._data.cantonese,
    });
    const romanization = this.html("div", {
      className: "romanization",
      textContent: this._data.romanization,
    });
    const translation = this.html("div", {
      className: "translation",
      textContent: this._data.translation,
    });

    this._playBtn = new Button({
      icon: "volume_up",
      variant: "filled",
      title: "Play audio",
    });
    this._playBtn.element.id = "play-audio";

    content.append(cantonese, romanization, translation);
    textRow.append(content, this._playBtn.element);
    container.append(speaker, textRow);

    this.shadowRoot.appendChild(container);
  }

  setupEventListeners() {
    this._playBtn.element.addEventListener("click", () => this.playAudio());
  }

  playAudio() {
    speakCantonese(this._data.cantonese, this._voiceConfig || {});
  }
}
