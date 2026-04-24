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
  static get observedAttributes() {
    return ["content"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._contentWrapper = this.shadowRoot.getElementById("content");
    this._content = [];
  }

  get content() {
    return this._content;
  }
  set content(val) {
    if (Array.isArray(val)) {
      this._content = val;
      this.setAttribute("content", JSON.stringify(val));
      this._render();
    }
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

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === "content") {
      try {
        this._content = JSON.parse(newVal);
      } catch (e) {
        console.error("🚨 [ExplanationPage ERROR]: Failed to parse content", e);
      }
    }
    this._render();
  }

  _render() {
    if (!this._contentWrapper) return;

    this._contentWrapper.innerHTML = ""; // Clear existing content

    this._content.forEach((chunk) => {
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
          el.cantonese = chunk.cantonese;
          el.romanization = chunk.romanization;
          el.translation = chunk.translation;
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
