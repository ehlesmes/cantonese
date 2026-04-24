import { Component } from "/components/shared/component.js";
import { iconStyles } from "/components/shared/shared_assets.js";
import { speakCantonese } from "/components/shared/tts.js";
import { IconButton } from "/components/ui/icon_button/icon_button.js";
import { Tooltip } from "/components/ui/tooltip/tooltip.js";

export class UnscrambleExercise extends Component {
  /**
   * @param {Object} [options]
   * @param {Array<[string, string]>} [options.tokens]
   * @param {string} [options.translation]
   */
  constructor(options = {}) {
    super("/components/unscramble_exercise/style.css");
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._container = document.createElement("div");
    this._container.className = "unscramble-wrapper";

    const phraseContainer = document.createElement("div");
    phraseContainer.className = "phrase-container";

    this._translationEl = document.createElement("div");
    this._translationEl.className = "translation-text";
    phraseContainer.appendChild(this._translationEl);

    this._playBtn = new IconButton({
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

    this._playBtn.element.onclick = () => this.playAudio();

    this._originalTokens = []; // [{text, romanization, id}]
    this._pool = [];
    this._slots = [];
    this._status = "incomplete";

    this.data = options;
  }

  get status() {
    return this._status;
  }

  get data() {
    return this._data;
  }

  set data(val) {
    const oldTokensJson = JSON.stringify(this._data.tokens || []);
    this._data = { ...this._data, ...val };
    const newTokensJson = JSON.stringify(this._data.tokens || []);

    if (oldTokensJson !== newTokensJson) {
      this._setTokens(this._data.tokens);
    }
    this.update();
  }

  validate() {
    if (!this._data.tokens || this._data.tokens.length === 0) {
      console.error(
        "🚨 [UnscrambleExercise ERROR]: Missing required data property 'tokens'!",
      );
    }
    if (!this._data.translation) {
      console.error(
        "🚨 [UnscrambleExercise ERROR]: Missing required data property 'translation'!",
      );
    }
  }

  _setTokens(tokenArray = []) {
    this._originalTokens = tokenArray.map((t, index) => ({
      text: t[0],
      romanization: t[1],
      id: index,
    }));
    this._slots = [];
    this._pool = [...this._originalTokens].sort(() => Math.random() - 0.5);
    this._calculateStatus();
  }

  update() {
    this.validate();
    this._translationEl.textContent = this._data.translation || "";
    this.render();
  }

  render() {
    const isSolved = this._status === "right";

    // Render Slots
    this._slotsContainer.innerHTML = "";
    this._slots.forEach((token) => {
      const el = this.createTokenElement(token);
      if (!isSolved) {
        el.onclick = () => this.moveToPool(token.id);
      }
      this._slotsContainer.appendChild(el);
    });

    // Render Pool
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
    const tooltip = new Tooltip();

    const trigger = document.createElement("div");
    trigger.slot = "trigger";
    trigger.className = "token";

    const textSpan = document.createElement("span");
    textSpan.className = "token-text";
    textSpan.textContent = token.text;
    trigger.appendChild(textSpan);

    const content = document.createElement("span");
    content.slot = "content";
    content.textContent = token.romanization;

    tooltip.element.appendChild(trigger);
    tooltip.element.appendChild(content);

    return tooltip.element;
  }

  moveToSlots(tokenId) {
    const wasEmpty = this._pool.length === 0;
    const poolIndex = this._pool.findIndex((t) => t.id === tokenId);
    if (poolIndex === -1) return;

    const token = this._pool.splice(poolIndex, 1)[0];
    this._slots.push(token);

    this._calculateStatus();
    this.render();

    if (!wasEmpty && this._pool.length === 0) {
      this.dispatch("complete");
    }
  }

  moveToPool(tokenId) {
    const wasEmpty = this._pool.length === 0;
    const slotIndex = this._slots.findIndex((t) => t.id === tokenId);
    if (slotIndex === -1) return;

    const token = this._slots.splice(slotIndex, 1)[0];
    this._pool.push(token);

    this._calculateStatus();
    this.render();

    if (wasEmpty && this._pool.length > 0) {
      this.dispatch("uncomplete");
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
      this.element.setAttribute("status", newStatus);
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

    this.dispatch("play-audio", { phrase: fullText });
  }
}
