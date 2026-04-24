import "/components/unscramble_exercise/unscramble_exercise.js";
import "/components/lesson_footer/lesson_footer.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/unscramble_page/style.css" />
<div class="page-container">
  <main>
    <unscramble-exercise id="exercise"></unscramble-exercise>
  </main>
  <lesson-footer id="footer"></lesson-footer>
</div>
`;

class UnscramblePage extends HTMLElement {
  static get observedAttributes() {
    return ["tokens", "translation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._exercise = this.shadowRoot.getElementById("exercise");
    this._footer = this.shadowRoot.getElementById("footer");

    this._tokens = [];
    this._translation = "";
  }

  get tokens() {
    return this._tokens;
  }
  set tokens(val) {
    if (Array.isArray(val)) {
      this._tokens = val;
      this.setAttribute("tokens", JSON.stringify(val));
      this._update();
    }
  }

  get translation() {
    return this._translation;
  }
  set translation(val) {
    this._translation = val || "";
    this.setAttribute("translation", this._translation);
    this._update();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("complete", () => {
      if (this._exercise.getAttribute("status") === "right") {
        this._exercise.playAudio();
      }
      this._update();
    });
    this.shadowRoot.addEventListener("uncomplete", () => this._update());
    this.shadowRoot.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.shadowRoot.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );
    this._update();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === "tokens") {
      try {
        this._tokens = JSON.parse(newVal);
      } catch (e) {
        console.error("🚨 [UnscramblePage ERROR]: Failed to parse tokens", e);
      }
    } else if (name === "translation") {
      this._translation = newVal || "";
    }
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;

    this._exercise.tokens = this._tokens;
    this._exercise.translation = this._translation;

    const status = this._exercise.getAttribute("status");
    const isFilled = status !== "incomplete";

    this._footer.setAttribute("primary-text", "Continue");
    this._footer.setAttribute("primary-disabled", isFilled ? "false" : "true");

    if (status === "wrong") {
      this._footer.setAttribute("secondary-text", "Try again");
    } else {
      this._footer.removeAttribute("secondary-text");
    }
  }

  _handlePrimaryClick() {
    const status = this._exercise.getAttribute("status");
    if (status !== "incomplete") {
      this.dispatchEvent(
        new CustomEvent("unscramble-result", {
          detail: { success: status === "right" },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  _handleSecondaryClick() {
    this._exercise.reset();
    this._update();
  }
}

if (!customElements.get("unscramble-page")) {
  customElements.define("unscramble-page", UnscramblePage);
}
