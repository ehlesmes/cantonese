import { BasePage } from "../shared/base_page.js";
import { PageRegistry } from "../shared/page_registry.js";
import { getCantoneseVoiceCount } from "../shared/tts.js";
import { DialogLine } from "../dialog_line/dialog_line.js";

/**
 * DialogPage Component
 * Manages a conversation between multiple speakers, showing lines one by one.
 */
export class DialogPage extends BasePage {
  /**
   * @param {Object} data
   * @param {Array<Object>} data.lines
   */
  constructor(data) {
    // Initial footer config
    const footerConfig = {
      primaryText:
        data.lines && data.lines.length > 1 ? "Next Line" : "Continue",
    };
    super(data, ["lines"], import.meta.url, footerConfig);

    this._fullData = data;
    this._currentLineIndex = 0;
    this._speakerVoices = new Map();

    this._initializeVoices();
    this.renderContent(data);
  }

  _initializeVoices() {
    if (!this._fullData || !this._fullData.lines) return;

    const uniqueSpeakers = [
      ...new Set(this._fullData.lines.map((line) => line.speaker)),
    ];
    const systemVoiceCount = getCantoneseVoiceCount();

    uniqueSpeakers.forEach((speakerId, index) => {
      const config = {
        index,
        pitch: 1.0,
        rate: 0.85,
      };

      if (systemVoiceCount <= 1 && index > 0) {
        config.pitch = 0.8;
        config.rate = 0.8;
      }

      this._speakerVoices.set(speakerId, { config, speakerIndex: index });
    });
  }

  renderContent(data) {
    if (!data || !data.lines) return;

    this.contentWrapper.replaceChildren();
    const list = this.html("div", { className: "dialog-list" });

    // Show lines up to currentLineIndex
    for (let i = 0; i <= this._currentLineIndex; i++) {
      const lineData = data.lines[i];
      const speakerInfo = this._speakerVoices.get(lineData.speaker);

      const line = new DialogLine(
        lineData,
        speakerInfo.config,
        speakerInfo.speakerIndex,
      );
      line.element.classList.add("dialog-line");
      list.appendChild(line.element);
    }

    this.contentWrapper.appendChild(list);
  }

  handlePrimaryClick() {
    const isLastLine =
      this._currentLineIndex === this._fullData.lines.length - 1;

    if (isLastLine) {
      this.dispatch("dialog-complete");
    } else {
      this._currentLineIndex++;
      const isNowLastLine =
        this._currentLineIndex === this._fullData.lines.length - 1;

      if (isNowLastLine) {
        this.footer.primaryText = "Continue";
      }

      this.renderContent(this._fullData);

      // Scroll the last line into view
      const lines = this.contentWrapper.querySelectorAll("dialog-line");
      if (lines.length > 0) {
        lines[lines.length - 1].element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }
}

PageRegistry.set("dialog", DialogPage);
