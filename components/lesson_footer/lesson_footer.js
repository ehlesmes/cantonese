const footerTemplate = document.createElement("template");
footerTemplate.innerHTML = `
<link rel="stylesheet" href="/components/lesson_footer/style.css" />
<footer>
  <button id="secondary-btn" class="secondary hidden"></button>
  <button id="primary-btn" class="primary"></button>
</footer>
`;

export class LessonFooter extends HTMLElement {
  static get observedAttributes() {
    return ["primary-text", "secondary-text"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.getElementById("primary-btn").onclick = () => {
      this.dispatchEvent(
        new CustomEvent("primary-click", { bubbles: true, composed: true }),
      );
    };
    this.shadowRoot.getElementById("secondary-btn").onclick = () => {
      this.dispatchEvent(
        new CustomEvent("secondary-click", { bubbles: true, composed: true }),
      );
    };
    this.updateButtons();
  }

  attributeChangedCallback() {
    this.updateButtons();
  }

  updateButtons() {
    const primaryBtn = this.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = this.shadowRoot.getElementById("secondary-btn");

    const primaryText = this.getAttribute("primary-text");
    const secondaryText = this.getAttribute("secondary-text");

    if (primaryBtn) {
      primaryBtn.textContent = primaryText || "Next";
    }

    if (secondaryBtn) {
      if (secondaryText) {
        secondaryBtn.textContent = secondaryText;
        secondaryBtn.classList.remove("hidden");
      } else {
        secondaryBtn.classList.add("hidden");
      }
    }
  }
}

if (!customElements.get("lesson-footer")) {
  customElements.define("lesson-footer", LessonFooter);
}
