import { Component } from "../shared/component.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { PageRegistry } from "../shared/page_registry.js";

export class CongratulationsPage extends Component {
  /**
   * @param {Object} data
   * @param {string} data.title
   * @param {string} data.summary
   * @param {string} [data.nextLessonId]
   */
  constructor(data) {
    super(import.meta.url);

    this.validate(data, ["title", "summary"]);

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";

    const title = document.createElement("h1");
    title.textContent = data.title;
    contentWrapper.appendChild(title);

    const summary = document.createElement("p");
    summary.textContent = data.summary;
    contentWrapper.appendChild(summary);

    main.appendChild(contentWrapper);
    container.appendChild(main);

    const hasNextLesson = Boolean(data.nextLessonId);

    this._footer = new LessonFooter({
      primaryText: hasNextLesson ? "Next Lesson" : "Back Home",
      secondaryText: hasNextLesson ? "Back Home" : null,
    });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () => {
      if (hasNextLesson) {
        this.dispatch("next-lesson", { nextLessonId: data.nextLessonId });
      } else {
        this.dispatch("go-home");
      }
    });

    this.element.addEventListener("secondary-click", () => {
      // Secondary is only "Back Home" and only visible if there's a next lesson
      this.dispatch("go-home");
    });
  }
}

PageRegistry.set("congratulations", CongratulationsPage);
