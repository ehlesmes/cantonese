import { BasePage } from "../shared/base_page.js";
import { PageRegistry } from "../shared/page_registry.js";

export class PracticeSummaryPage extends BasePage {
  /**
   * @param {Object} data
   * @param {number} data.score
   * @param {number} data.total
   */
  constructor(data) {
    super(data, ["score", "total"], import.meta.url, {
      primaryText: "Practice More",
      secondaryText: "Finish",
    });
  }

  renderContent(data) {
    const title = this.html("h1", { textContent: "Practice Complete!" });
    this.contentWrapper.appendChild(title);

    const scoreDisplay = this.html("div", {
      className: "score-display",
      textContent: `${data.score} / ${data.total}`,
    });
    this.contentWrapper.appendChild(scoreDisplay);

    const message = this.html("p", {
      textContent: data.score === data.total ? "Perfect! 加油!" : "Good job! Keep practicing!",
    });
    this.contentWrapper.appendChild(message);
  }

  handlePrimaryClick() {
    this.dispatch("retry-practice");
  }

  handleSecondaryClick() {
    this.dispatch("go-home");
  }
}

PageRegistry.set("practice-summary", PracticeSummaryPage);
