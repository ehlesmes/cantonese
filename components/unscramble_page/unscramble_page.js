import "/components/unscramble_exercise/unscramble_exercise.js";
import "/components/lesson_footer/lesson_footer.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="/components/unscramble_page/style.css" />
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

    this._data = {
      tokens: [],
      translation: "",
    };
  }

  get data() {
    return this._data;
  }
  set data(val) {
    this._data = { ...this._data, ...val };
    this._update();
  }

  connectedCallback() {
    this._upgradeProperty("data");
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

  _upgradeProperty(prop) {
    if (Object.hasOwn(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  validate() {
    if (!this._data.tokens || this._data.tokens.length === 0) {
      console.error(
        "🚨 [UnscramblePage ERROR]: Missing required data property 'tokens'!",
      );
    }
    if (!this._data.translation) {
      console.error(
        "🚨 [UnscramblePage ERROR]: Missing required data property 'translation'!",
      );
    }
  }

  _update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    this._exercise.data = {
      tokens: this._data.tokens,
      translation: this._data.translation,
    };

    const status = this._exercise.status;
    const isFinished = status === "right" || status === "wrong";

    this._footer.data = {
      primaryText: "Continue",
      primaryDisabled: !isFinished,
      secondaryText: status === "wrong" ? "Try again" : "",
    };
  }

  _handlePrimaryClick() {
    const status = this._exercise.status;
    if (status === "right" || status === "wrong") {
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
