import { Component } from "../shared/component.js";
import { UnscrambleExercise } from "../unscramble_exercise/unscramble_exercise.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { PageRegistry } from "../shared/page_registry.js";

export class UnscramblePage extends Component {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    super({ cssPath: "./style.css", baseUrl: import.meta.url, ...config });

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    this._exercise = new UnscrambleExercise();
    this._exercise.element.id = "exercise";
    main.appendChild(this._exercise.element);
    container.appendChild(main);

    this._footer = new LessonFooter({
      data: {
        primaryText: "Continue",
        primaryDisabled: true,
      },
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
    this.element.addEventListener("uncomplete", () => {
      this.update();
    });
    this.element.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.element.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );

    this.update();
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
  }
}

PageRegistry.set("unscramble", UnscramblePage);
