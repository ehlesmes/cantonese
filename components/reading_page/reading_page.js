import { Component } from "/components/shared/component.js";
import { ReadingExercise } from "/components/reading_exercise/reading_exercise.js";
import { LessonFooter } from "/components/lesson_footer/lesson_footer.js";

export class ReadingPage extends Component {
  /**
   * @param {Object} [options]
   * @param {string} [options.cantonesePhrase]
   * @param {string} [options.romanization]
   * @param {string} [options.translation]
   */
  constructor(options = {}) {
    super("/components/reading_page/style.css");

    this._state = "initial"; // initial, revealed

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    this._exercise = new ReadingExercise(options);
    this._exercise.element.id = "exercise";
    main.appendChild(this._exercise.element);
    container.appendChild(main);

    this._footer = new LessonFooter({ primaryText: "Reveal Answer" });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.element.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );

    if (Object.keys(options).length > 0) {
      this.data = options;
    }
  }

  validate() {
    const required = ["cantonesePhrase", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        console.error(
          `🚨 [ReadingPage ERROR]: Missing required data property '${prop}'!`,
        );
      }
    });
  }

  update() {
    this.validate();
    const { cantonesePhrase, romanization, translation } = this._data;

    // Pass data to exercise
    this._exercise.data = {
      cantonesePhrase,
      romanization,
      translation,
      translationHidden: this._state === "initial",
    };

    if (this._state === "initial") {
      this._footer.data = {
        primaryText: "Reveal Answer",
        secondaryText: "",
      };
    } else {
      this._footer.data = {
        primaryText: "Got it right",
        secondaryText: "Need practice",
      };
    }
  }

  _handlePrimaryClick() {
    if (this._state === "initial") {
      this._state = "revealed";
      this._exercise.playAudio();
      this.update();
    } else {
      this.dispatch("reading-result", { success: true });
    }
  }

  _handleSecondaryClick() {
    if (this._state === "revealed") {
      this.dispatch("reading-result", { success: false });
    }
  }
}
