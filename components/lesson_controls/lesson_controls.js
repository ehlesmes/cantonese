import { iconStyles } from "/components/shared/shared_assets.js";
import "/components/ui/icon_button/icon_button.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/lesson_controls/style.css" />

<div class="controls">
  <ui-icon-button id="restart" title="Restart Lesson">restart_alt</ui-icon-button>

  <div class="divider"></div>

  <ui-icon-button id="prev" title="Previous Page">arrow_back</ui-icon-button>
  <ui-icon-button id="next" title="Next Page">arrow_forward</ui-icon-button>

  <div class="divider"></div>

  <ui-icon-button id="close" title="Close">close</ui-icon-button>
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
          new CustomEvent(id, {
            bubbles: true, // Travel up the DOM
            composed: true, // Cross shadow boundaries
          }),
        );
      };
    });
  }
}

if (!customElements.get("lesson-controls")) {
  customElements.define("lesson-controls", LessonControls);
}
