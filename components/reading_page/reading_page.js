import "/components/reading_exercise/reading_exercise.js";
import "/components/lesson_footer/lesson_footer.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/reading_page/style.css" />
<div class="page-container">
  <main>
    <reading-exercise id="exercise"></reading-exercise>
  </main>
  <lesson-footer id="footer"></lesson-footer>
</div>
`;

class ReadingPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._exercise = this.shadowRoot.getElementById("exercise");
    this._footer = this.shadowRoot.getElementById("footer");
    this._state = "initial"; // initial, revealed

    this._data = {
      cantonesePhrase: "",
      romanization: "",
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
    this.shadowRoot.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.shadowRoot.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );
    this._update();
  }

  _upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  validate() {
    const required = ["cantonesePhrase", "romanization", "translation"];
    required.forEach((prop) => {
      if (!this._data[prop]) {
        console.error(
          `🚨 [ReadingPage ERROR]: Missing required data property '${prop}'!`,
        );
      }
    });
  }

  _update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    const { cantonesePhrase, romanization, translation } = this._data;

    // Pass data to exercise via property
    this._exercise.data = {
      cantonesePhrase,
      romanization,
      translation,
      translationHidden: this._state === "initial",
    };

    if (this._state === "initial") {
      this._footer.data = {
        primaryText: "Reveal Answer",
        secondaryText: "",
      };
    } else {
      this._footer.data = {
        primaryText: "Got it right",
        secondaryText: "Need practice",
      };
    }
  }

  _handlePrimaryClick() {
    if (this._state === "initial") {
      this._state = "revealed";
      this._exercise.playAudio();
      this._update();
    } else {
      this.dispatchEvent(
        new CustomEvent("reading-result", {
          detail: { success: true },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  _handleSecondaryClick() {
    if (this._state === "revealed") {
      this.dispatchEvent(
        new CustomEvent("reading-result", {
          detail: { success: false },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

if (!customElements.get("reading-page")) {
  customElements.define("reading-page", ReadingPage);
}
