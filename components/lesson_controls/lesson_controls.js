import { iconStyles } from "/components/shared/shared_assets.js";

const template = document.createElement("template");
template.innerHTML = `
<!-- Material Symbols must be imported inside Shadow DOM if used directly, 
     or inherited if using standard font-family -->
<link rel="stylesheet" href="components/lesson_controls/style.css" />

<div class="controls">
  <button id="restart" title="Restart Lesson">
      <span class="material-symbols-outlined">restart_alt</span>
  </button>

  <div class="divider"></div>

  <button id="prev" title="Previous Page">
      <span class="material-symbols-outlined">arrow_back</span>
  </button>

  <button id="next" title="Next Page">
      <span class="material-symbols-outlined">arrow_forward</span>
  </button>

  <div class="divider"></div>

  <button id="close" title="Close">
      <span class="material-symbols-outlined">close</span>
  </button>
</div>
`;

/**
 * LessonControls Component
 * A reusable UI element for lesson navigation and actions.
 */
class LessonControls extends HTMLElement {
  constructor() {
    super();
    // Attach a shadow root to ensure styles are encapsulated
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    // Add event listeners
    ["restart", "prev", "next", "close"].forEach((id) => {
      this.shadowRoot.getElementById(id).onclick = () => {
        this.dispatchEvent(
          new CustomEvent(`lesson-${id}`, {
            bubbles: true, // Travel up the DOM
            composed: true, // Cross shadow boundaries
            detail: { originalId: id },
          }),
        );
      };
    });
  }
}

if (!customElements.get("lesson-controls")) {
  customElements.define("lesson-controls", LessonControls);
}
