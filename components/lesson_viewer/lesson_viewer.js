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
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._header = this.shadowRoot.getElementById("header");
    this._main = this.shadowRoot.getElementById("m");

    this._data = {
      lessonId: "",
      lessonName: "",
    };
  }

  get data() {
    return this._data;
  }
  set data(val) {
    this._data = { ...this._data, ...val };
    this.update();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener(
      "lesson-restart",
      () => (this._main.scrollTop = 0),
    );
    this.update();
  }

  validate() {
    if (!this._data.lessonName) {
      console.error(
        "🚨 [LessonViewer ERROR]: Missing required data property 'lessonName'!",
      );
    }
  }

  update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    if (this._header) {
      this._header.data = { lessonName: this._data.lessonName || "" };
    }
  }
}

if (!customElements.get("lesson-viewer")) {
  customElements.define("lesson-viewer", LessonViewer);
}
