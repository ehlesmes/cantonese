import { Component } from "../shared/component.js";
import { UnscrambleExercise } from "../unscramble_exercise/unscramble_exercise.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { PageRegistry } from "../shared/page_registry.js";

export class UnscramblePage extends Component {
  /**
   * @param {Object} data
   * @param {Array<[string, string]>} data.tokens
   * @param {string} data.translation
   */
  constructor(data) {
    super(import.meta.url);

    this.validate(data, ["tokens", "translation"]);

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    this._exercise = new UnscrambleExercise(data);
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
      this._updateFooter();
    });

    this.element.addEventListener("uncomplete", () => {
      this._updateFooter();
    });

    this.element.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.element.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );
  }

  _updateFooter() {
    const status = this._exercise.status;
    const isFinished = status === "right" || status === "wrong";

    this._footer.setPrimaryDisabled(!isFinished);
    this._footer.setSecondary(status === "wrong" ? "Try again" : null);
  }

  _handlePrimaryClick() {
    const status = this._exercise.status;
    if (status === "right" || status === "wrong") {
      this.dispatch("unscramble-result", { success: status === "right" });
    }
  }

  _handleSecondaryClick() {
    this._exercise.reset();
    this._updateFooter();
  }
}

PageRegistry.set("unscramble", UnscramblePage);
