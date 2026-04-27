import { Component } from "../shared/component.js";

export class AppShell extends Component {
  constructor() {
    super(import.meta.url);

    this._currentView = null;
    this._nav = null;
    this._onHashChange = () => this.handleRoute();

    this.render();
    this.setupRouting();
  }

  render() {
    const container = this.html("div", { className: "app-shell" });

    // Navigation Header Slot
    this._header = this.html("header", { className: "app-header" });
    container.appendChild(this._header);

    // Main Content Slot
    this._main = this.html("main", { className: "app-content" });
    container.appendChild(this._main);

    this.shadowRoot.appendChild(container);
  }

  /**
   * Sets up the hash-based routing listeners.
   */
  setupRouting() {
    window.addEventListener("hashchange", this._onHashChange);

    // Initial route - set default if empty
    if (!window.location.hash) {
      window.location.hash = "#/home";
    } else {
      this.handleRoute();
    }
  }

  /**
   * Cleanup listeners when the component is removed.
   */
  disconnectedCallback() {
    window.removeEventListener("hashchange", this._onHashChange);
    super.disconnectedCallback?.();
  }

  /**
   * Handles route changes and switches views.
   */
  async handleRoute() {
    const hash = window.location.hash || "#/home";

    // Determine if we should be in "Focus Mode" (hide nav)
    const isFocusMode =
      hash.startsWith("#/lesson/") || hash.startsWith("#/practice");
    this.toggleFocusMode(isFocusMode);

    // View switching logic will go here in Phase 2

    // Update active tab in Nav if it exists
    if (this._nav && !isFocusMode) {
      this._nav.setActiveHash(hash);
    }
  }

  /**
   * Toggles the visibility of the navigation header.
   * @param {boolean} isFocusMode
   */
  toggleFocusMode(isFocusMode) {
    if (isFocusMode) {
      this._header.classList.add("hidden");
    } else {
      this._header.classList.remove("hidden");
    }
  }

  /**
   * Injects the navigation component into the shell.
   * @param {HTMLElement} navComponent
   */
  setNav(navComponent) {
    this._nav = navComponent;
    this._header.innerHTML = "";
    this._header.appendChild(navComponent.element);
  }
}
