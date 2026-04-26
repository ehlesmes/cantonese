import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { Button } from "../ui/button/button.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";

export class UnscrambleExercise extends Component {
  /**
   * @param {Object} data
   * @param {Array<[string, string]>} data.tokens
   * @param {string} data.translation
   */
  constructor(data) {
    super(import.meta.url);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];

    this.validate(data, ["tokens", "translation"]);
    const { tokens, translation } = data;

    this._originalTokens = tokens.map((t, index) => ({
      text: t[0],
      romanization: t[1],
      id: index,
    }));

    this._container = document.createElement("div");
    this._container.className = "unscramble-wrapper";

    const phraseContainer = document.createElement("div");
    phraseContainer.className = "phrase-container";

    const translationEl = document.createElement("div");
    translationEl.className = "translation-text";
    translationEl.textContent = translation;
    phraseContainer.appendChild(translationEl);

    this._playBtn = new Button({
      title: "Play Audio",
      icon: "volume_up",
    });
    phraseContainer.appendChild(this._playBtn.element);

    this._container.appendChild(phraseContainer);

    this._slotsContainer = document.createElement("div");
    this._slotsContainer.className = "slots-container";
    this._slotsContainer.id = "slots";
    this._container.appendChild(this._slotsContainer);

    this._poolContainer = document.createElement("div");
    this._poolContainer.className = "pool-container";
    this._poolContainer.id = "pool";
    this._container.appendChild(this._poolContainer);

    this.shadowRoot.appendChild(this._container);

    this._playBtn.element.addEventListener("click", () => this.playAudio());

    this._pool = [];
    this._slots = [];

    this.reset();
  }

  get status() {
    if (this._pool.length > 0) return "incomplete";
    if (this._slots.length === 0) return "incomplete";
    const isCorrect = this._slots.every((token, index) => token.id === index);
    return isCorrect ? "right" : "wrong";
  }

  reset() {
    this._slots = [];
    this._pool = [...this._originalTokens].sort(() => Math.random() - 0.5);
    this.render();
  }

  render() {
    const isSolved = this.status === "right";
    this.element.setAttribute("status", this.status);

    this._slotsContainer.innerHTML = "";
    this._slots.forEach((token) => {
      const el = this.createTokenElement(token);
      if (!isSolved) {
        el.onclick = () => this.moveToPool(token.id);
      }
      this._slotsContainer.appendChild(el);
    });

    this._poolContainer.innerHTML = "";
    this._pool.forEach((token) => {
      const el = this.createTokenElement(token);
      if (!isSolved) {
        el.onclick = () => this.moveToSlots(token.id);
      }
      this._poolContainer.appendChild(el);
    });
  }

  createTokenElement(token) {
    const trigger = document.createElement("div");
    trigger.className = "token";

    const textSpan = document.createElement("span");
    textSpan.className = "token-text";
    textSpan.textContent = token.text;
    trigger.appendChild(textSpan);

    const content = document.createElement("span");
    content.textContent = token.romanization;

    const tooltip = new Tooltip({
      trigger,
      content,
    });

    return tooltip.element;
  }

  moveToSlots(tokenId) {
    const poolIndex = this._pool.findIndex((t) => t.id === tokenId);
    if (poolIndex === -1) return;

    const token = this._pool.splice(poolIndex, 1)[0];
    this._slots.push(token);

    this.render();

    if (this._pool.length === 0) {
      this.dispatch("complete");
    }
  }

  moveToPool(tokenId) {
    const slotIndex = this._slots.findIndex((t) => t.id === tokenId);
    if (slotIndex === -1) return;

    const wasEmpty = this._pool.length === 0;
    const token = this._slots.splice(slotIndex, 1)[0];
    this._pool.push(token);

    this.render();

    if (wasEmpty && this._pool.length > 0) {
      this.dispatch("uncomplete");
    }
  }

  playAudio() {
    const fullText = this._originalTokens.map((t) => t.text).join("");
    speakCantonese(fullText);
    this.dispatch("play-audio", { phrase: fullText });
  }
}
