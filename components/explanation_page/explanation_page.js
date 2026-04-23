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

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    if (!this._contentWrapper) return;

    const contentAttr = this.getAttribute("content");
    if (!contentAttr) return;

    try {
      const chunks = JSON.parse(contentAttr);
      this._contentWrapper.innerHTML = ""; // Clear existing content

      chunks.forEach((chunk) => {
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
            el.setAttribute("cantonese", chunk.cantonese);
            el.setAttribute("romanization", chunk.romanization);
            el.setAttribute("translation", chunk.translation);
            break;
          default:
            console.warn(
              `⚠️ [ExplanationPage]: Unknown chunk type "${chunk.type}"`,
            );
        }
        if (el) this._contentWrapper.appendChild(el);
      });
    } catch (e) {
      console.error(
        "🚨 [ExplanationPage ERROR]: Failed to parse content JSON",
        e,
      );
    }
  }
}

if (!customElements.get("explanation-page")) {
  customElements.define("explanation-page", ExplanationPage);
}
