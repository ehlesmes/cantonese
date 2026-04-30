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
      primaryText: data.lines && data.lines.length > 1 ? "Next Line" : "Continue",
    };
    super(data, ["lines"], import.meta.url, footerConfig);
  }

  _initializeVoices(data) {
    const uniqueSpeakers = [...new Set(data.lines.map((line) => line.speaker))];
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
    // Set up state since this is called during super()
    this._fullData = data;
    this._currentLineIndex = 0;
    this._speakerVoices = new Map();
    this._initializeVoices(data);

    this._list = this.html("div", { className: "dialog-list" });
    this.contentWrapper.appendChild(this._list);

    // Initial first line
    this._appendLine(0);
  }

  _appendLine(index) {
    const lineData = this._fullData.lines[index];
    const speakerInfo = this._speakerVoices.get(lineData.speaker);

    const line = new DialogLine(lineData, speakerInfo.config, speakerInfo.speakerIndex);
    line.element.classList.add("dialog-line");
    this._list.appendChild(line.element);

    // Auto-play audio for the new line
    line.playAudio();
  }

  handlePrimaryClick() {
    const isLastLine = this._currentLineIndex === this._fullData.lines.length - 1;

    if (isLastLine) {
      this.dispatch("dialog-complete");
    } else {
      this._currentLineIndex++;
      const isNowLastLine = this._currentLineIndex === this._fullData.lines.length - 1;

      if (isNowLastLine) {
        this.footer.primaryText = "Continue";
      }

      this._appendLine(this._currentLineIndex);

      // Scroll the last line into view
      const lines = this._list.querySelectorAll(".dialog-line");
      if (lines.length > 0) {
        lines[lines.length - 1].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }
}

PageRegistry.set("dialog", DialogPage);
