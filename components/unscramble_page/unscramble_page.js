import { BasePage } from "../shared/page.js";
import { UnscrambleExercise } from "../unscramble_exercise/unscramble_exercise.js";
import { PageRegistry } from "../shared/page_registry.js";

export class UnscramblePage extends BasePage {
  /**
   * @param {Object} data
   * @param {Array<[string, string]>} data.tokens
   * @param {string} data.translation
   */
  constructor(data) {
    super(data, ["tokens", "translation"], import.meta.url, {
      primaryText: "Continue",
      primaryDisabled: true,
    });
  }

  renderContent(data) {
    this._exercise = new UnscrambleExercise(data);
    this._exercise.element.id = "exercise";
    this.contentWrapper.appendChild(this._exercise.element);
  }

  setupEventListeners() {
    super.setupEventListeners();
    this.element.addEventListener("complete", () => {
      if (this._exercise.status === "right") {
        this._exercise.playAudio();
      }
      this._updateFooter();
    });

    this.element.addEventListener("uncomplete", () => {
      this._updateFooter();
    });
  }

  _updateFooter() {
    const status = this._exercise.status;
    const isFinished = status === "right" || status === "wrong";

    this.footer.primaryDisabled = !isFinished;
    this.footer.secondaryText = status === "wrong" ? "Try again" : null;
  }

  handlePrimaryClick() {
    const status = this._exercise.status;
    if (status === "right" || status === "wrong") {
      this.dispatch("unscramble-result", { success: status === "right" });
    }
  }

  handleSecondaryClick() {
    this._exercise.reset();
    this._updateFooter();
  }
}

PageRegistry.set("unscramble", UnscramblePage);
