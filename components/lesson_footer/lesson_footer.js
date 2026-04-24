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
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));

    this._data = {
      primaryText: "",
      secondaryText: "",
      primaryDisabled: false,
      secondaryDisabled: false,
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
    this._upgradeProperty("data");
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
    this.update();
  }

  _upgradeProperty(prop) {
    if (Object.hasOwn(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  validate() {
    if (!this._data.primaryText) {
      console.error(
        "🚨 [LessonFooter ERROR]: Missing required data property 'primaryText'!",
      );
    }
  }

  update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    const primaryBtn = this.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = this.shadowRoot.getElementById("secondary-btn");

    if (primaryBtn) {
      primaryBtn.textContent = this._data.primaryText || "Next";
      if (this._data.primaryDisabled) {
        primaryBtn.setAttribute("disabled", "");
      } else {
        primaryBtn.removeAttribute("disabled");
      }
    }

    if (secondaryBtn) {
      if (this._data.secondaryText) {
        secondaryBtn.textContent = this._data.secondaryText;
        secondaryBtn.classList.remove("hidden");
        if (this._data.secondaryDisabled) {
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
