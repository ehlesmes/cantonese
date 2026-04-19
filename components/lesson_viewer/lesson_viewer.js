import "/components/lesson_header/lesson_header.js";
import "/components/lesson_footer/lesson_footer.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="/components/lesson/style.css" />
<div class="lesson-container">
  <lesson-header id="h"></lesson-header>
  <main id="m"><slot></slot></main>
  <lesson-footer id="f"></lesson-footer>
</div>
`;

export class LessonViewer extends HTMLElement {
  static get observedAttributes() {
    return ["lesson-name", "primary-text", "secondary-text"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(
      viewerTemplate.content.cloneNode(true),
    );
  }
  connectedCallback() {
    this.shadowRoot.addEventListener(
      "lesson-restart",
      () => (this.shadowRoot.getElementById("m").scrollTop = 0),
    );
    this.update();
  }
  attributeChangedCallback() {
    this.update();
  }
  update() {
    const h = this.shadowRoot.getElementById("h"),
      f = this.shadowRoot.getElementById("f");
    if (h)
      h.setAttribute("lesson-name", this.getAttribute("lesson-name") || "");
    if (f) {
      f.setAttribute("primary-text", this.getAttribute("primary-text") || "");
      f.setAttribute(
        "secondary-text",
        this.getAttribute("secondary-text") || "",
      );
    }
  }
}

if (!customElement.get("lesson-viewer")) {
  customElements.define("lesson-viewer", LessonViewer);
}
