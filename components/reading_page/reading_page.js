import { Component } from "../shared/component.js";
import { ReadingExercise } from "../reading_exercise/reading_exercise.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { PageRegistry } from "../shared/page_registry.js";

export class ReadingPage extends Component {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    super({ cssPath: "./style.css", baseUrl: import.meta.url, ...config });

    this._state = "initial"; // initial, revealed

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    // Initial exercise setup. Its data will be set in update()
    this._exercise = new ReadingExercise();
    this._exercise.element.id = "exercise";
    main.appendChild(this._exercise.element);
    container.appendChild(main);

    this._footer = new LessonFooter({ data: { primaryText: "Reveal Answer" } });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.element.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );

    this.update();
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

PageRegistry.set("reading", ReadingPage);
