import { Component } from "/components/shared/component.js";
import { LessonFooter } from "/components/lesson_footer/lesson_footer.js";
import { ExampleCard } from "/components/example_card/example_card.js";

export class ExplanationPage extends Component {
  /**
   * @param {Object} [options]
   * @param {Array<{type: string, value?: string, cantonese?: string, romanization?: string, translation?: string}>} [options.content]
   */
  constructor(options = {}) {
    super("/components/explanation_page/style.css");

    this._data = { content: [] };

    const container = document.createElement("div");
    container.className = "page-container";

    const main = document.createElement("main");
    this._contentWrapper = document.createElement("div");
    this._contentWrapper.className = "content-wrapper";
    this._contentWrapper.id = "content";
    main.appendChild(this._contentWrapper);
    container.appendChild(main);

    this._footer = new LessonFooter({ primaryText: "Continue" });
    container.appendChild(this._footer.element);

    this.shadowRoot.appendChild(container);

    this.element.addEventListener("primary-click", () => {
      this.dispatch("explanation-complete");
    });

    if (Object.keys(options).length > 0) {
      this.data = options;
    }
  }

  validate() {
    if (!this._data.content || this._data.content.length === 0) {
      console.error(
        "🚨 [ExplanationPage ERROR]: Missing required data property 'content'!",
      );
    }
  }

  update() {
    this.validate();

    if (this._footer) {
      this._footer.data = { primaryText: "Continue" };
    }

    this._contentWrapper.innerHTML = ""; // Clear existing content

    const content = this._data.content || [];
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
      if (el) this._contentWrapper.appendChild(el);
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
