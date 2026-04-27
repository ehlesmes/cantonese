import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { Button } from "../ui/button/button.js";
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

    this._wrapper = this.html("div", { className: "example-wrapper" });

    const label = this.html("div", {
      className: "example-label",
      textContent: "Example",
    });
    this._wrapper.appendChild(label);

    const contentRow = this.html("div", { className: "content-row" });

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

    contentRow.appendChild(this._tooltip.element);

    this._playBtn = new Button({
      title: "Listen",
      icon: "volume_up",
    });
    this._playBtn.element.id = "play-audio";
    contentRow.appendChild(this._playBtn.element);

    this._wrapper.appendChild(contentRow);

    this._translationEl = this.html("div", {
      className: "translation-text",
      textContent: translation,
    });
    this._wrapper.appendChild(this._translationEl);

    this.shadowRoot.appendChild(this._wrapper);
  }

  setupEventListeners() {
    this._playBtn.element.addEventListener("click", () => this.playAudio());
  }

  playAudio() {
    speakCantonese(this._cantonese);
  }
}
