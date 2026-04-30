import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { Button } from "../ui/button/button.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";
import { SrsBadge } from "../ui/srs_badge/srs_badge.js";

export class VocabularyItem extends Component {
  /**
   * @param {Object} data
   * @param {string} data.cantonese
   * @param {string} data.romanization
   * @param {string} data.translation
   * @param {number} data.level
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["cantonese", "romanization", "translation", "level"]);
    this._data = data;

    this.render();
    this.setupEventListeners();
  }

  render() {
    const { cantonese, romanization, translation, level } = this._data;

    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, iconStyles];

    this._row = this.html("div", { className: "vocab-row" });

    // SRS Badge
    this._badge = new SrsBadge({ level });
    this._row.appendChild(this._badge.element);

    // Cantonese + Tooltip
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
    this._row.appendChild(this._tooltip.element);

    // Translation
    this._translationEl = this.html("div", {
      className: "translation-text",
      textContent: translation,
    });
    this._row.appendChild(this._translationEl);

    // Play Button
    this._playBtn = new Button({
      title: "Listen",
      icon: "volume_up",
      variant: "outline",
    });
    this._playBtn.element.classList.add("play-btn");
    this._row.appendChild(this._playBtn.element);

    this.shadowRoot.appendChild(this._row);
  }

  setupEventListeners() {
    this._playBtn.element.addEventListener("click", (e) => {
      e.stopPropagation();
      speakCantonese(this._data.cantonese);
    });
  }
}
