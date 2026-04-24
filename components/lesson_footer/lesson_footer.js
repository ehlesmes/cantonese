const footerTemplate = document.createElement("template");
footerTemplate.innerHTML = `
<link rel="stylesheet" href="/components/shared/button.css" />
<link rel="stylesheet" href="/components/lesson_footer/style.css" />
<footer>
  <button id="secondary-btn" class="btn-base btn-outline hidden"></button>
  <button id="primary-btn" class="btn-base btn-filled"></button>
</footer>
`;

export class LessonFooter extends HTMLElement {
  static get observedAttributes() {
    return [
      "primary-text",
      "secondary-text",
      "primary-disabled",
      "secondary-disabled",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));
  }

  get primaryText() {
    return this.getAttribute("primary-text");
  }
  set primaryText(val) {
    if (val) this.setAttribute("primary-text", val);
    else this.removeAttribute("primary-text");
  }

  get secondaryText() {
    return this.getAttribute("secondary-text");
  }
  set secondaryText(val) {
    if (val) this.setAttribute("secondary-text", val);
    else this.removeAttribute("secondary-text");
  }

  get primaryDisabled() {
    return (
      this.hasAttribute("primary-disabled") &&
      this.getAttribute("primary-disabled") !== "false"
    );
  }
  set primaryDisabled(val) {
    this.setAttribute("primary-disabled", val ? "true" : "false");
  }

  get secondaryDisabled() {
    return (
      this.hasAttribute("secondary-disabled") &&
      this.getAttribute("secondary-disabled") !== "false"
    );
  }
  set secondaryDisabled(val) {
    this.setAttribute("secondary-disabled", val ? "true" : "false");
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
    const primaryDisabled =
      this.hasAttribute("primary-disabled") &&
      this.getAttribute("primary-disabled") !== "false";
    const secondaryDisabled =
      this.hasAttribute("secondary-disabled") &&
      this.getAttribute("secondary-disabled") !== "false";

    if (!primaryText) {
      console.error(
        "🚨 [LessonFooter ERROR]: Missing required attribute 'primary-text'!",
      );
    }

    if (primaryBtn) {
      primaryBtn.textContent = primaryText || "Next";
      if (primaryDisabled) {
        primaryBtn.setAttribute("disabled", "");
      } else {
        primaryBtn.removeAttribute("disabled");
      }
    }

    if (secondaryBtn) {
      if (secondaryText) {
        secondaryBtn.textContent = secondaryText;
        secondaryBtn.classList.remove("hidden");
        if (secondaryDisabled) {
          secondaryBtn.setAttribute("disabled", "");
        } else {
          secondaryBtn.removeAttribute("disabled");
        }
      } else {
        secondaryBtn.classList.add("hidden");
      }
    }
  }
}

if (!customElements.get("lesson-footer")) {
  customElements.define("lesson-footer", LessonFooter);
}
