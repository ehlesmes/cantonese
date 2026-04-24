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

    this._cantonesePhrase = "";
    this._romanization = "";
    this._translation = "";
  }

  get cantonesePhrase() {
    return this._cantonesePhrase;
  }
  set cantonesePhrase(val) {
    this._cantonesePhrase = val || "";
    this._update();
  }

  get romanization() {
    return this._romanization;
  }
  set romanization(val) {
    this._romanization = val || "";
    this._update();
  }

  get translation() {
    return this._translation;
  }
  set translation(val) {
    this._translation = val || "";
    this._update();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("primary-click", () =>
      this._handlePrimaryClick(),
    );
    this.shadowRoot.addEventListener("secondary-click", () =>
      this._handleSecondaryClick(),
    );
    this._update();
  }

  validate() {
    const required = {
      cantonesePhrase: this._cantonesePhrase,
      romanization: this._romanization,
      translation: this._translation,
    };

    Object.entries(required).forEach(([prop, val]) => {
      if (!val) {
        console.error(
          `🚨 [ReadingPage ERROR]: Missing required property '${prop}'!`,
        );
      }
    });
  }

  _update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    // Pass data to exercise via properties
    this._exercise.cantonesePhrase = this._cantonesePhrase;
    this._exercise.romanization = this._romanization;
    this._exercise.translation = this._translation;

    if (this._state === "initial") {
      this._exercise.translationHidden = true;
      this._footer.primaryText = "Reveal Answer";
      this._footer.secondaryText = "";
    } else {
      this._exercise.translationHidden = false;
      this._footer.primaryText = "Got it right";
      this._footer.secondaryText = "Need practice";
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
