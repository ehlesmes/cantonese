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
  static get observedAttributes() {
    return ["lesson-name"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(headerTemplate.content.cloneNode(true));
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "lesson-name") {
      if (!newVal) {
        console.error(
          "🚨 [LessonHeader ERROR]: Missing required attribute 'lesson-name'!"
        );
      }
      this.shadowRoot.getElementById("lesson-title").textContent = newVal;
    }
  }
}

if (!customElements.get("lesson-header")) {
  customElements.define("lesson-header", LessonHeader);
}
