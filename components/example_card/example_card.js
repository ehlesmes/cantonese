import { Component } from "/components/shared/component.js";
import { iconStyles } from "/components/shared/shared_assets.js";
import { speakCantonese } from "/components/shared/tts.js";
import { IconButton } from "/components/ui/icon_button/icon_button.js";
import { Tooltip } from "/components/ui/tooltip/tooltip.js";

export class ExampleCard extends Component {
  /**
   * @param {Object} [options]
   * @param {string} [options.cantonese]
   * @param {string} [options.romanization]
   * @param {string} [options.translation]
   */
  constructor(options = {}) {
    super("/components/example_card/style.css");
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._wrapper = document.createElement("div");
    this._wrapper.className = "example-wrapper";

    const label = document.createElement("div");
    label.className = "example-label";
    label.textContent = "Example";
    this._wrapper.appendChild(label);

    const contentRow = document.createElement("div");
    contentRow.className = "content-row";

    this._tooltip = new Tooltip();

    this._cantoneseEl = document.createElement("div");
    this._cantoneseEl.slot = "trigger";
    this._cantoneseEl.className = "cantonese-text";
    this._tooltip.element.appendChild(this._cantoneseEl);

    this._romanizationEl = document.createElement("span");
    this._romanizationEl.slot = "content";
    this._romanizationEl.className = "romanization-text";
    this._tooltip.element.appendChild(this._romanizationEl);

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
    this._wrapper.appendChild(this._translationEl);

    this.shadowRoot.appendChild(this._wrapper);

    this._playBtn.element.onclick = () => this.playAudio();

    this.data = options;
  }

  validate() {
    const required = ["cantonese", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        console.error(
          `🚨 [ExampleCard ERROR]: Missing required data property '${prop}'!`,
        );
      }
    });
  }

  update() {
    this.validate();
    const { cantonese, romanization, translation } = this._data;

    if (this._cantoneseEl) this._cantoneseEl.textContent = cantonese || "";
    if (this._romanizationEl)
      this._romanizationEl.textContent = romanization || "";
    if (this._translationEl)
      this._translationEl.textContent = translation || "";
  }

  playAudio() {
    const { cantonese } = this._data;
    if (cantonese) {
      speakCantonese(cantonese);
    }
  }
}
