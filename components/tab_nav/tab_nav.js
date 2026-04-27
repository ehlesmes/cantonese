import { Component } from "../shared/component.js";

export class TabNav extends Component {
  /**
   * @param {Object} options
   * @param {Array<{label: string, hash: string}>} options.tabs
   */
  constructor(options) {
    super(import.meta.url);
    this._tabs = options.tabs;
    this._buttons = new Map();

    this.render();
  }

  render() {
    const nav = document.createElement("nav");
    nav.className = "tab-nav";

    this._tabs.forEach((tab) => {
      const btn = document.createElement("a");
      btn.className = "tab-button";
      btn.href = tab.hash;
      btn.textContent = tab.label;

      nav.appendChild(btn);
      this._buttons.set(tab.hash, btn);
    });

    this.shadowRoot.appendChild(nav);
  }

  /**
   * Updates the visual active state based on the current hash.
   * @param {string} currentHash
   */
  setActiveHash(currentHash) {
    // Remove active class from all
    this._buttons.forEach((btn) => btn.classList.remove("active"));

    // Add to current
    const activeBtn = this._buttons.get(currentHash);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }
}
