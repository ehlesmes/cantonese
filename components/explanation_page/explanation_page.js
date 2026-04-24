import "/components/lesson_footer/lesson_footer.js";
import "/components/example_card/example_card.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/explanation_page/style.css" />
<div class="page-container">
  <main>
    <div class="content-wrapper" id="content"></div>
  </main>
  <lesson-footer id="footer" primary-text="Continue"></lesson-footer>
</div>
`;

class ExplanationPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._contentWrapper = this.shadowRoot.getElementById("content");
    this._data = {
      content: [],
    };
  }

  get data() {
    return this._data;
  }
  set data(val) {
    this._data = { ...this._data, ...val };
    this._render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("primary-click", () => {
      this.dispatchEvent(
        new CustomEvent("explanation-complete", {
          bubbles: true,
          composed: true,
        }),
      );
    });
    this._render();
  }

  validate() {
    if (!this._data.content || this._data.content.length === 0) {
      console.error(
        "🚨 [ExplanationPage ERROR]: Missing required data property 'content'!",
      );
    }
  }

  _render() {
    if (!this._contentWrapper) return;

    if (this.isConnected) {
      this.validate();
    }

    this._contentWrapper.innerHTML = ""; // Clear existing content

    this._data.content.forEach((chunk) => {
      let el;
      switch (chunk.type) {
        case "title":
          el = document.createElement("h1");
          el.textContent = chunk.value;
          break;
        case "text":
          el = document.createElement("p");
          el.innerHTML = chunk.value; // Allow bold tags etc.
          break;
        case "example":
          el = document.createElement("example-card");
          el.data = {
            cantonese: chunk.cantonese,
            romanization: chunk.romanization,
            translation: chunk.translation,
          };
          break;
        default:
          console.warn(
            `⚠️ [ExplanationPage]: Unknown chunk type "${chunk.type}"`,
          );
      }
      if (el) this._contentWrapper.appendChild(el);
    });
  }
}

if (!customElements.get("explanation-page")) {
  customElements.define("explanation-page", ExplanationPage);
}
