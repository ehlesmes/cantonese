import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { IconButton } from "../ui/icon_button/icon_button.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";
import { ValidationError } from "../shared/validation_error.js";

export class ExampleCard extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.data]
   * @param {string} [config.data.cantonese]
   * @param {string} [config.data.romanization]
   * @param {string} [config.data.translation]
   */
  constructor(config = {}) {
    super(config, import.meta.url);
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._wrapper = document.createElement("div");
    this._wrapper.className = "example-wrapper";

    const label = document.createElement("div");
    label.className = "example-label";
    label.textContent = "Example";
    this._wrapper.appendChild(label);

    const contentRow = document.createElement("div");
    contentRow.className = "content-row";

    this._cantoneseEl = document.createElement("div");
    this._cantoneseEl.className = "cantonese-text";
    this._cantoneseEl.textContent = this._data.cantonese;

    this._romanizationEl = document.createElement("span");
    this._romanizationEl.className = "romanization-text";
    this._romanizationEl.textContent = this._data.romanization;

    this._tooltip = new Tooltip({
      trigger: this._cantoneseEl,
      content: this._romanizationEl,
    });
    this._tooltip.element.id = "tooltip";

    contentRow.appendChild(this._tooltip.element);

    this._playBtn = new IconButton({
      title: "Listen",
      icon: "volume_up",
    });
    this._playBtn.element.id = "play-audio";
    contentRow.appendChild(this._playBtn.element);

    this._wrapper.appendChild(contentRow);

    this._translationEl = document.createElement("div");
    this._translationEl.className = "translation-text";
    this._translationEl.textContent = this._data.translation;
    this._wrapper.appendChild(this._translationEl);

    this.shadowRoot.appendChild(this._wrapper);

    this._playBtn.element.onclick = () => this.playAudio();

    this.update();
  }

  validate() {
    const required = ["cantonese", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        throw new ValidationError(`Missing required data property '${prop}'!`);
      }
    });
  }

  update() {
    this._cantoneseEl.textContent = this._data.cantonese;
    this._romanizationEl.textContent = this._data.romanization;
    this._translationEl.textContent = this._data.translation;
  }

  playAudio() {
    speakCantonese(this._data.cantonese);
  }
}
