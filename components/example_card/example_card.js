import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { IconButton } from "../ui/icon_button/icon_button.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";

export class ExampleCard extends Component {
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
    this._cantoneseEl.textContent = cantonese;

    this._romanizationEl = document.createElement("span");
    this._romanizationEl.className = "romanization-text";
    this._romanizationEl.textContent = romanization;

    this._tooltip = new Tooltip({
      trigger: this._cantoneseEl,
      content: this._romanizationEl,
    });

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
    this._translationEl.textContent = translation;
    this._wrapper.appendChild(this._translationEl);

    this.shadowRoot.appendChild(this._wrapper);

    this._playBtn.element.onclick = () => this.playAudio();
  }

  playAudio() {
    speakCantonese(this._cantonese);
  }
}
