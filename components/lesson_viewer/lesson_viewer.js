import "/components/lesson_header/lesson_header.js";
import "/components/lesson_footer/lesson_footer.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="/components/lesson_viewer/style.css" />
<div class="lesson-container">
  <lesson-header id="header"></lesson-header>
  <main id="m"><slot></slot></main>
  <lesson-footer id="footer"></lesson-footer>
</div>
`;

export class LessonViewer extends HTMLElement {
  static get observedAttributes() {
    return ["lesson-name", "primary-text", "secondary-text"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
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
    const header = this.shadowRoot.getElementById("header");
    const footer = this.shadowRoot.getElementById("footer");

    const lessonName = this.getAttribute("lesson-name");
    if (!lessonName) {
      console.error(
        "🚨 [LessonViewer ERROR]: Missing required attribute 'lesson-name'!",
      );
    }

    if (header) {
      header.setAttribute("lesson-name", lessonName || "");
    }
    if (footer) {
      footer.setAttribute(
        "primary-text",
        this.getAttribute("primary-text") || "",
      );
      footer.setAttribute(
        "secondary-text",
        this.getAttribute("secondary-text") || "",
      );
    }
  }
}

if (!customElements.get("lesson-viewer")) {
  customElements.define("lesson-viewer", LessonViewer);
}
