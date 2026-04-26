import { Component } from "../shared/component.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { PageRegistry } from "../shared/page_registry.js";

export class PracticeEmptyPage extends Component {
  constructor() {
    super(import.meta.url);

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";

    const title = document.createElement("h1");
    title.textContent = "No exercises yet!";
    contentWrapper.appendChild(title);

    const message = document.createElement("p");
    message.textContent =
      "Complete some lessons first to add exercises to your practice queue.";
    contentWrapper.appendChild(message);

    main.appendChild(contentWrapper);
    container.appendChild(main);

    this._footer = new LessonFooter({
      primaryText: "Go Home",
    });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () => {
      this.dispatch("go-home");
    });
  }
}

PageRegistry.set("practice-empty", PracticeEmptyPage);
