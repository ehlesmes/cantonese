import { Component } from "/components/shared/component.js";
import { UnscrambleExercise } from "/components/unscramble_exercise/unscramble_exercise.js";
import { LessonFooter } from "/components/lesson_footer/lesson_footer.js";

export class UnscramblePage extends Component {
  /**
   * @param {Object} [options]
   * @param {Array<[string, string]>} [options.tokens]
   * @param {string} [options.translation]
   */
  constructor(options = {}) {
    super("/components/unscramble_page/style.css");

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    this._exercise = new UnscrambleExercise(options);
    this._exercise.element.id = "exercise";
    main.appendChild(this._exercise.element);
    container.appendChild(main);

    this._footer = new LessonFooter({
      primaryText: "Continue",
      primaryDisabled: true,
    });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("complete", () => {
      if (this._exercise.status === "right") {
        this._exercise.playAudio();
      }
      this.update();
    });
    this.element.addEventListener("uncomplete", () => this.update());
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
    if (!this._data.tokens || this._data.tokens.length === 0) {
      console.error(
        "🚨 [UnscramblePage ERROR]: Missing required data property 'tokens'!",
      );
    }
    if (!this._data.translation) {
      console.error(
        "🚨 [UnscramblePage ERROR]: Missing required data property 'translation'!",
      );
    }
  }

  update() {
    this.validate();

    this._exercise.data = {
      tokens: this._data.tokens,
      translation: this._data.translation,
    };

    const status = this._exercise.status;
    const isFinished = status === "right" || status === "wrong";

    this._footer.data = {
      primaryText: "Continue",
      primaryDisabled: !isFinished,
      secondaryText: status === "wrong" ? "Try again" : "",
    };
  }

  _handlePrimaryClick() {
    const status = this._exercise.status;
    if (status === "right" || status === "wrong") {
      this.dispatch("unscramble-result", { success: status === "right" });
    }
  }

  _handleSecondaryClick() {
    this._exercise.reset();
    this.update();
  }
}
