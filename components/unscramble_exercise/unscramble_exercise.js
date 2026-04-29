import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { speakCantonese } from "../shared/tts.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";
import { AudioControls } from "../ui/audio_controls/audio_controls.js";

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

    this._originalTokens = data.tokens.map((t, index) => ({
      text: t[0],
      romanization: t[1],
      id: index,
    }));

    this._tokenElements = new Map();
    this._originalTokens.forEach((token) => {
      this._tokenElements.set(token.id, this.createTokenElement(token));
    });

    this._pool = [];
    this._slots = [];

    this.render(data);
    this.setupEventListeners();
    this.reset();
  }

  render(data) {
    this._container = this.html("div", { className: "unscramble-wrapper" });

    const phraseContainer = this.html("div", { className: "phrase-container" });

    this._translationEl = this.html("div", {
      className: "translation-text",
      textContent: data.translation,
    });
    phraseContainer.appendChild(this._translationEl);

    this._audioControls = new AudioControls({
      onPlay: () => this.playAudio(),
      onPlaySlow: () => this.playAudio(0.1),
    });
    this._audioControls.element.classList.add("audio-controls");
    phraseContainer.appendChild(this._audioControls.element);

    this._container.appendChild(phraseContainer);

    this._slotsContainer = this.html("div", {
      className: "slots-container",
      id: "slots",
    });
    this._container.appendChild(this._slotsContainer);

    this._poolContainer = this.html("div", {
      className: "pool-container",
      id: "pool",
    });
    this._container.appendChild(this._poolContainer);

    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {}

  get status() {
    if (this._pool.length > 0) return "incomplete";
    if (this._slots.length === 0) return "incomplete";
    const isCorrect = this._slots.every((token, index) => token.id === index);
    return isCorrect ? "right" : "wrong";
  }

  reset() {
    this._slots = [];
    this._pool = [...this._originalTokens].sort(() => Math.random() - 0.5);
    this.update();
  }

  update() {
    const isSolved = this.status === "right";
    this.element.setAttribute("status", this.status);

    // Non-destructive update: appendChild moves existing nodes
    this._slots.forEach((token) => {
      const el = this._tokenElements.get(token.id);
      el.onclick = isSolved ? null : () => this.moveToPool(token.id);
      this._slotsContainer.appendChild(el);
    });

    this._pool.forEach((token) => {
      const el = this._tokenElements.get(token.id);
      el.onclick = isSolved ? null : () => this.moveToSlots(token.id);
      this._poolContainer.appendChild(el);
    });
  }

  createTokenElement(token) {
    const trigger = this.html("div", { className: "token" });
    const textSpan = this.html("span", {
      className: "token-text",
      textContent: token.text,
    });
    trigger.appendChild(textSpan);

    const content = this.html("span", { textContent: token.romanization });

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

    this.update();

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

    this.update();

    if (wasEmpty && this._pool.length > 0) {
      this.dispatch("uncomplete");
    }
  }

  playAudio(rate = 0.85) {
    const fullText = this._originalTokens.map((t) => t.text).join("");
    speakCantonese(fullText, { rate });
    this.dispatch("play-audio", { phrase: fullText, rate });
  }
}
