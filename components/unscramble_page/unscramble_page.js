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
      this._update();
    }
  }

  get translation() {
    return this._translation;
  }
  set translation(val) {
    this._translation = val || "";
    this._update();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("complete", () => {
      if (this._exercise.status === "right") {
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

  validate() {
    if (this._tokens.length === 0) {
      console.error(
        "🚨 [UnscramblePage ERROR]: Missing required property 'tokens'!",
      );
    }
    if (!this._translation) {
      console.error(
        "🚨 [UnscramblePage ERROR]: Missing required property 'translation'!",
      );
    }
  }

  _update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    this._exercise.tokens = this._tokens;
    this._exercise.translation = this._translation;

    const status = this._exercise.status;
    const isFilled = status !== "incomplete";

    this._footer.primaryText = "Continue";
    this._footer.primaryDisabled = !isFilled;

    if (status === "wrong") {
      this._footer.secondaryText = "Try again";
    } else {
      this._footer.secondaryText = "";
    }
  }

  _handlePrimaryClick() {
    const status = this._exercise.status;
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
