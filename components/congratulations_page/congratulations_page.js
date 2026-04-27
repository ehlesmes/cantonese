import { BasePage } from "../shared/page.js";
import { PageRegistry } from "../shared/page_registry.js";

export class CongratulationsPage extends BasePage {
  /**
   * @param {Object} data
   * @param {string} data.title
   * @param {string} data.summary
   * @param {string} [data.nextLessonId]
   */
  constructor(data) {
    const hasNextLesson = Boolean(data.nextLessonId);
    super(data, ["title", "summary"], import.meta.url, {
      primaryText: hasNextLesson ? "Next Lesson" : "Back Home",
      secondaryText: hasNextLesson ? "Back Home" : null,
    });

    this._nextLessonId = data.nextLessonId;
  }

  renderContent(data) {
    const titleEl = this.html("h1", { textContent: data.title });
    this.contentWrapper.appendChild(titleEl);

    const summaryEl = this.html("p", { textContent: data.summary });
    this.contentWrapper.appendChild(summaryEl);
  }

  handlePrimaryClick() {
    if (this._nextLessonId) {
      this.dispatch("next-lesson", { nextLessonId: this._nextLessonId });
    } else {
      this.dispatch("go-home");
    }
  }

  handleSecondaryClick() {
    this.dispatch("go-home");
  }
}

PageRegistry.set("congratulations", CongratulationsPage);
