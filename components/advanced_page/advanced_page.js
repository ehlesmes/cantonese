import { Component } from "../shared/component.js";
import { Routes } from "../shared/routes.js";
import { getAvailableVoices, speakCantonese } from "../shared/tts.js";
import { Button } from "../ui/button/button.js";

export class AdvancedPage extends Component {
  constructor() {
    super(import.meta.url);
    this._voices = [];
    this._statusTimeout = null;
    this._container = null;
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (!this._container) {
      this._container = this.html("div", { className: "advanced-container" });
      this.shadowRoot.appendChild(this._container);
    }

    const container = this._container;
    container.replaceChildren();

    const header = this.html("header", { className: "page-header" });
    header.appendChild(this.html("h1", { textContent: "Advanced Settings" }));
    header.appendChild(
      this.html("p", {
        className: "page-description",
        textContent: "Configure system-wide preferences and inspect local storage.",
      }),
    );
    container.appendChild(header);

    // 1. Voice Settings Section
    const voiceSection = this.html("section", { className: "settings-card" });
    voiceSection.appendChild(this.html("h2", { textContent: "Cantonese Voice" }));
    voiceSection.appendChild(
      this.html("p", {
        className: "section-hint",
        textContent: "Choose the voice used for all Cantonese text-to-speech features.",
      }),
    );

    const voiceControls = this.html("div", { className: "voice-controls" });
    this._voiceSelect = this.html("select", { id: "voice-select" });
    this.updateVoiceList();
    voiceControls.appendChild(this._voiceSelect);

    const actionRow = this.html("div", { className: "action-row" });

    this._auditionBtn = new Button({
      label: "Play Sample",
      variant: "outline",
    });

    this._saveVoiceBtn = new Button({
      label: "Save Preference",
      variant: "filled",
    });

    actionRow.appendChild(this._auditionBtn.element);
    actionRow.appendChild(this._saveVoiceBtn.element);
    voiceSection.appendChild(voiceControls);
    voiceSection.appendChild(actionRow);
    container.appendChild(voiceSection);

    // 2. Storage Inspector Section
    const storageSection = this.html("section", {
      className: "settings-card",
    });
    storageSection.appendChild(this.html("h2", { textContent: "Storage Inspector" }));
    storageSection.appendChild(
      this.html("p", {
        className: "section-hint",
        textContent: "Directly view and edit raw application state stored in LocalStorage.",
      }),
    );

    const storageList = this.html("div", { className: "storage-list" });

    Object.keys(localStorage).forEach((key) => {
      const value = localStorage.getItem(key);
      const row = this.html("div", { className: "storage-row" });

      const info = this.html("div", { className: "storage-info" });
      info.appendChild(this.html("span", { className: "storage-key", textContent: key }));

      const input = this.html("input", { className: "storage-input", value });
      info.appendChild(input);

      const saveBtn = new Button({
        label: "Update",
        variant: "outline",
      });
      saveBtn.element.dataset.key = key;
      saveBtn.element.classList.add("storage-update-btn");

      row.appendChild(info);
      row.appendChild(saveBtn.element);
      storageList.appendChild(row);
    });
    storageSection.appendChild(storageList);
    container.appendChild(storageSection);

    this._statusMessage = this.html("div", { className: "status-message" });
    container.appendChild(this._statusMessage);
  }

  showStatus(message) {
    this._statusMessage.textContent = message;
    this._statusMessage.classList.add("visible");

    if (this._statusTimeout) clearTimeout(this._statusTimeout);
    this._statusTimeout = setTimeout(() => {
      this._statusMessage.classList.remove("visible");
    }, 3000);
  }

  updateVoiceList() {
    this._voices = getAvailableVoices();
    const preferredName = localStorage.getItem("cantonese_preferred_voice_name");

    this._voiceSelect.replaceChildren();
    if (this._voices.length === 0) {
      const option = document.createElement("option");
      option.textContent = "No Cantonese voices found";
      this._voiceSelect.appendChild(option);
      return;
    }

    this._voices.forEach((voice, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      if (voice.name === preferredName) {
        option.selected = true;
      }
      this._voiceSelect.appendChild(option);
    });
  }

  setupEventListeners() {
    this._auditionBtn.element.addEventListener("click", () => {
      const selectedIndex = this._voiceSelect.selectedIndex;
      const voice = this._voices[selectedIndex];
      if (voice) {
        speakCantonese("你好，我係你嘅廣東話老師。", {}, voice);
      }
    });

    this._saveVoiceBtn.element.addEventListener("click", () => {
      const selectedIndex = this._voiceSelect.selectedIndex;
      const voice = this._voices[selectedIndex];
      if (voice) {
        localStorage.setItem("cantonese_preferred_voice_name", voice.name);
        this.showStatus(`Saved preferred voice: ${voice.name}`);
      }
    });

    this._container.addEventListener("click", (e) => {
      const updateBtn = e.target.closest(".storage-update-btn");
      if (updateBtn) {
        const key = updateBtn.dataset.key;
        const row = updateBtn.closest(".storage-row");
        const input = row.querySelector(".storage-input");
        localStorage.setItem(key, input.value);
        this.showStatus(`Updated ${key}`);
      }
    });

    this._onVoicesChanged = () => this.updateVoiceList();
    window.speechSynthesis.addEventListener("voiceschanged", this._onVoicesChanged);
  }

  disconnectedCallback() {
    window.speechSynthesis.removeEventListener("voiceschanged", this._onVoicesChanged);
  }
}

Routes.register(Routes.ADVANCED, AdvancedPage);
