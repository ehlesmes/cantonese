import { BasePage } from "../shared/page.js";
import { ReadingExercise } from "../reading_exercise/reading_exercise.js";
import { PageRegistry } from "../shared/page_registry.js";

export class ReadingPage extends BasePage {
  constructor(data) {
    super(data, ["cantonese", "romanization", "translation"], import.meta.url, {
      primaryText: "Reveal Answer",
    });

    this._revealed = false;

    this._exercise = new ReadingExercise(data);
    this._exercise.element.id = "exercise";
    this.contentWrapper.appendChild(this._exercise.element);
  }

  _reveal() {
    this._revealed = true;
    this._exercise.showTranslation();
    this.footer.setPrimary("Got it right");
    this.footer.setSecondary("Need practice");
  }

  handlePrimaryClick() {
    if (!this._revealed) {
      this._reveal();
      this._exercise.playAudio();
    } else {
      this.dispatch("reading-result", { success: true });
    }
  }

  handleSecondaryClick() {
    if (this._revealed) {
      this.dispatch("reading-result", { success: false });
    }
  }
}

PageRegistry.set("reading", ReadingPage);
