import "/components/lesson_header/lesson_header.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="/components/lesson_viewer/style.css" />
<div class="lesson-container">
  <lesson-header id="header"></lesson-header>
  <main id="m"><slot></slot></main>
</div>
`;

export class LessonViewer extends HTMLElement {
  static get observedAttributes() {
    return ["lesson-name"];
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

    const lessonName = this.getAttribute("lesson-name");
    if (!lessonName) {
      console.error(
        "🚨 [LessonViewer ERROR]: Missing required attribute 'lesson-name'!",
      );
    }

    if (header) {
      header.setAttribute("lesson-name", lessonName || "");
    }
  }
}

if (!customElements.get("lesson-viewer")) {
  customElements.define("lesson-viewer", LessonViewer);
}
