import { Component } from "../shared/component.js";

export class TabNav extends Component {
  /**
   * @param {Object} options
   * @param {Array<{label: string, hash: string}>} options.tabs
   */
  constructor(options) {
    super(import.meta.url);
    this._buttons = new Map();

    this.render(options);
  }

  render(options) {
    const nav = this.html("nav", { className: "tab-nav" });

    options.tabs.forEach((tab) => {
      const btn = this.html("a", {
        className: "tab-button",
        textContent: tab.label,
        href: tab.hash,
      });

      nav.appendChild(btn);
      this._buttons.set(tab.hash, btn);
    });

    this.shadowRoot.appendChild(nav);
  }

  /**
   * Updates the visual active state based on the current hash.
   */
  get activeHash() {
    for (const [hash, btn] of this._buttons) {
      if (btn.classList.contains("active")) return hash;
    }
    return null;
  }

  set activeHash(currentHash) {
    // Remove active class from all
    this._buttons.forEach((btn) => btn.classList.remove("active"));

    // Add to current
    const activeBtn = this._buttons.get(currentHash);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }
}
