import { Component } from "../shared/component.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";
import { ExampleCard } from "../example_card/example_card.js";
import { PageRegistry } from "../shared/page_registry.js";

export class ExplanationPage extends Component {
  /**
   * @param {Object} data
   * @param {Array<Object>} data.content
   */
  constructor(data) {
    super(import.meta.url);

    this.validate(data, ["content"]);

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";
    contentWrapper.id = "content";

    this._renderContent(contentWrapper, data.content);

    main.appendChild(contentWrapper);
    container.appendChild(main);

    this._footer = new LessonFooter({ primaryText: "Continue" });
    this._footer.element.id = "footer";
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () => {
      this.dispatch("explanation-complete");
    });
  }

  /**
   * @param {HTMLElement} wrapper
   * @param {Array<Object>} content
   */
  _renderContent(wrapper, content) {
    content.forEach((chunk) => {
      let el;
      switch (chunk.type) {
        case "title":
          el = document.createElement("h1");
          el.textContent = chunk.value;
          break;
        case "text":
          el = document.createElement("p");
          this._renderRichText(el, chunk.value || "");
          break;
        case "example": {
          const card = new ExampleCard({
            cantonese: chunk.cantonese,
            romanization: chunk.romanization,
            translation: chunk.translation,
          });
          el = card.element;
          break;
        }
        default:
          console.warn(
            `⚠️ [ExplanationPage]: Unknown chunk type "${chunk.type}"`,
          );
      }
      if (el) wrapper.appendChild(el);
    });
  }

  /**
   * Simple parser to avoid innerHTML for basic formatting like <strong>.
   */
  _renderRichText(parent, text) {
    const parts = text.split(/(<strong>.*?<\/strong>)/g);
    parts.forEach((part) => {
      if (part.startsWith("<strong>")) {
        const strong = document.createElement("strong");
        strong.textContent = part.replace(/<\/?strong>/g, "");
        parent.appendChild(strong);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }
}

PageRegistry.set("explanation", ExplanationPage);
