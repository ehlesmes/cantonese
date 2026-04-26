import { Component } from "../shared/component.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { PageRegistry } from "../shared/page_registry.js";

export class PracticeSummaryPage extends Component {
  /**
   * @param {Object} data
   * @param {number} data.score
   * @param {number} data.total
   */
  constructor(data) {
    super(import.meta.url);

    this.validate(data, ["score", "total"]);

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";

    const title = document.createElement("h1");
    title.textContent = "Practice Complete!";
    contentWrapper.appendChild(title);

    const scoreDisplay = document.createElement("div");
    scoreDisplay.className = "score-display";
    scoreDisplay.textContent = `${data.score} / ${data.total}`;
    contentWrapper.appendChild(scoreDisplay);

    const message = document.createElement("p");
    message.textContent =
      data.score === data.total
        ? "Perfect! 加油!"
        : "Good job! Keep practicing!";
    contentWrapper.appendChild(message);

    main.appendChild(contentWrapper);
    container.appendChild(main);

    this._footer = new LessonFooter({
      primaryText: "Practice More",
      secondaryText: "Finish",
    });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () => {
      this.dispatch("retry-practice");
    });

    this.element.addEventListener("secondary-click", () => {
      this.dispatch("go-home");
    });
  }
}

PageRegistry.set("practice-summary", PracticeSummaryPage);
