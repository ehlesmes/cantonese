import { iconStyles } from "/components/shared/shared_assets.js";
import { speakCantonese } from "/components/shared/tts.js";
import "/components/ui/icon_button/icon_button.js";
import "/components/ui/tooltip/tooltip.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="components/unscramble_exercise/style.css" />
<div class="unscramble-wrapper">
  <div class="phrase-container">
    <div class="translation-text"></div>
    <ui-icon-button id="play-audio" title="Play Audio">volume_up</ui-icon-button>
  </div>

  <div class="slots-container" id="slots"></div>
  <div class="pool-container" id="pool"></div>
</div>
`;

class UnscrambleExercise extends HTMLElement {
  static get observedAttributes() {
    return ["tokens", "status", "translation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [iconStyles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._slotsContainer = this.shadowRoot.getElementById("slots");
    this._poolContainer = this.shadowRoot.getElementById("pool");
    this._playBtn = this.shadowRoot.getElementById("play-audio");
    this._translationEl = this.shadowRoot.querySelector(".translation-text");

    this._originalTokens = []; // [{text, romanization, id}]
    this._pool = [];
    this._slots = [];
    this._status = "incomplete";
  }

  get status() {
    return this._status;
  }

  connectedCallback() {
    this._playBtn.onclick = () => this.playAudio();
    if (!this.hasAttribute("status")) {
      this.setAttribute("status", "incomplete");
    }
    this.update();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "status") {
      this._status = newVal;
    } else {
      this.update();
    }
  }

  update() {
    if (!this.shadowRoot) return;

    const tokensAttr = this.getAttribute("tokens");
    const translation = this.getAttribute("translation") || "";

    if (!tokensAttr) {
      console.error(
        "🚨 [UnscrambleExercise ERROR]: Missing required attribute 'tokens'!",
      );
      return;
    }

    if (this._lastTokensAttr !== tokensAttr) {
      this._lastTokensAttr = tokensAttr;
      try {
        const parsed = JSON.parse(tokensAttr);
        this._originalTokens = parsed.map((t, index) => ({
          text: t[0],
          romanization: t[1],
          id: index,
        }));

        this._slots = [];
        this._pool = [...this._originalTokens].sort(() => Math.random() - 0.5);
        this._calculateStatus();
      } catch (e) {
        console.error(
          "🚨 [UnscrambleExercise ERROR]: Failed to parse 'tokens' JSON!",
          e,
        );
      }
    }

    if (this._translationEl) this._translationEl.textContent = translation;
    this.render();
  }
  render() {
    const isSolved = this._status === "right";

    // Render Slots
    this._slotsContainer.innerHTML = "";
    this._slots.forEach((token, index) => {
      const el = this.createTokenElement(token);
      if (!isSolved) {
        el.addEventListener("click", () => this.moveToPool(index));
      }
      this._slotsContainer.appendChild(el);
    });

    // Render Pool
    this._poolContainer.innerHTML = "";
    this._pool.forEach((token, index) => {
      const el = this.createTokenElement(token);
      if (!isSolved) {
        el.addEventListener("click", () => this.moveToSlots(index));
      }
      this._poolContainer.appendChild(el);
    });
  }
  createTokenElement(token) {
    const tooltip = document.createElement("ui-tooltip");

    const trigger = document.createElement("div");
    trigger.slot = "trigger";
    trigger.className = "token";
    trigger.innerHTML = `<span class="token-text">${token.text}</span>`;

    const content = document.createElement("span");
    content.slot = "content";
    content.textContent = token.romanization;

    tooltip.appendChild(trigger);
    tooltip.appendChild(content);

    return tooltip;
  }

  moveToSlots(poolIndex) {
    const wasEmpty = this._pool.length === 0;
    const token = this._pool.splice(poolIndex, 1)[0];
    this._slots.push(token);

    this._calculateStatus();
    this.render();

    if (!wasEmpty && this._pool.length === 0) {
      this.dispatchEvent(
        new CustomEvent("complete", { bubbles: true, composed: true }),
      );
    }
  }

  moveToPool(slotIndex) {
    const wasEmpty = this._pool.length === 0;
    const token = this._slots.splice(slotIndex, 1)[0];
    this._pool.push(token);

    this._calculateStatus();
    this.render();

    if (wasEmpty && this._pool.length > 0) {
      this.dispatchEvent(
        new CustomEvent("uncomplete", { bubbles: true, composed: true }),
      );
    }
  }

  _calculateStatus() {
    let newStatus = "incomplete";

    if (this._pool.length === 0 && this._slots.length > 0) {
      const isCorrect = this._slots.every((token, index) => token.id === index);
      newStatus = isCorrect ? "right" : "wrong";
    }

    if (this._status !== newStatus) {
      this._status = newStatus;
      this.setAttribute("status", newStatus);
    }
  }

  reset() {
    this._slots = [];
    this._pool = [...this._originalTokens].sort(() => Math.random() - 0.5);
    this._calculateStatus();
    this.render();
  }

  playAudio() {
    if (this._originalTokens.length === 0) return;
    const fullText = this._originalTokens.map((t) => t.text).join("");
    speakCantonese(fullText);

    this.dispatchEvent(
      new CustomEvent("play-audio", {
        detail: { phrase: fullText },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("unscramble-exercise")) {
  customElements.define("unscramble-exercise", UnscrambleExercise);
}
