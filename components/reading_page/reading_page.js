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
  static get observedAttributes() {
    return ["cantonese-phrase", "romanization", "translation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._exercise = this.shadowRoot.getElementById("exercise");
    this._footer = this.shadowRoot.getElementById("footer");
    this._state = "initial"; // initial, revealed
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

  attributeChangedCallback() {
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;

    // Pass attributes to exercise
    this._exercise.setAttribute(
      "cantonese-phrase",
      this.getAttribute("cantonese-phrase") || "",
    );
    this._exercise.setAttribute(
      "romanization",
      this.getAttribute("romanization") || "",
    );
    this._exercise.setAttribute(
      "translation",
      this.getAttribute("translation") || "",
    );

    if (this._state === "initial") {
      this._exercise.setAttribute("translation-hidden", "true");
      this._footer.setAttribute("primary-text", "Reveal Answer");
      this._footer.removeAttribute("secondary-text");
    } else {
      this._exercise.setAttribute("translation-hidden", "false");
      this._footer.setAttribute("primary-text", "Got it right");
      this._footer.setAttribute("secondary-text", "Need practice");
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
