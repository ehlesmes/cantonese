import "/components/lesson_controls/lesson_controls.js";

const headerTemplate = document.createElement("template");
headerTemplate.innerHTML = `
<link rel="stylesheet" href="components/lesson_header/style.css" />

<header>
  <div class="title" id="lesson-title">Lesson</div>
  <lesson-controls></lesson-controls>
</header>
`;

class LessonHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(headerTemplate.content.cloneNode(true));
    this._data = {
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
    this.update();
  }

  validate() {
    if (!this._data.lessonName) {
      console.error(
        "🚨 [LessonHeader ERROR]: Missing required data property 'lessonName'!",
      );
    }
  }

  update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    this.shadowRoot.getElementById("lesson-title").textContent =
      this._data.lessonName || "";
  }
}

if (!customElements.get("lesson-header")) {
  customElements.define("lesson-header", LessonHeader);
}
