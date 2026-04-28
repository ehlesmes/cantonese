import { Component } from "../shared/component.js";
import { Routes } from "../shared/routes.js";
import { LessonViewer } from "../lesson_viewer/lesson_viewer.js";
import { LessonProvider } from "../shared/lesson_provider.js";
import { PracticeViewer } from "../practice_viewer/practice_viewer.js";

// Trigger self-registration of pages
import "../dashboard_page/dashboard_page.js";
import "../vocabulary_page/vocabulary_page.js";
import "../advanced_page/advanced_page.js";

export class AppShell extends Component {
  constructor() {
    super(import.meta.url);

    this._currentView = null;
    this._nav = null;
    this._onHashChange = () => this.handleRoute();

    this.render();
    this.setupEventListeners();
    this.setupRouting();
  }

  setupEventListeners() {
    // Listen for events from sub-components to return home
    this.element.addEventListener("go-home", () => {
      window.location.hash = Routes.HOME;
    });
    this.element.addEventListener("close", () => {
      window.location.hash = Routes.HOME;
    });
    this.element.addEventListener("next-lesson", (e) => {
      const { nextLessonId } = e.detail;
      window.location.hash = Routes.lesson(nextLessonId);
    });

    window.addEventListener("hashchange", this._onHashChange);
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
    // Initial route - set default if empty
    if (!window.location.hash) {
      window.location.hash = Routes.HOME;
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
    const hash = window.location.hash || Routes.HOME;

    // Determine if we should be in "Focus Mode" (hide nav)
    const isFocusMode = Routes.isFocusMode(hash);
    this.toggleFocusMode(isFocusMode);

    let nextView;

    const lessonId = Routes.parseLessonId(hash);
    if (lessonId) {
      // Resolve the name before creating the viewer to avoid "Loading..." header flicker
      const lessonName = await LessonProvider.getLessonName(lessonId);
      nextView = new LessonViewer({ lessonId, lessonName });
    } else if (hash === Routes.PRACTICE) {
      nextView = new PracticeViewer();
    } else {
      const PageClass = Routes.getComponent(hash);
      if (PageClass) {
        nextView = new PageClass();
      } else {
        console.error(`Unknown route: ${hash}`);
        // Fallback to home
        window.location.hash = Routes.HOME;
        return;
      }
    }

    this._currentView = nextView;
    this._main.replaceChildren(nextView.element);

    // Update active tab in Nav if it exists
    if (this._nav && !isFocusMode) {
      this._nav.activeHash = hash;
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
  set nav(navComponent) {
    this._nav = navComponent;
    this._header.replaceChildren(navComponent.element);
  }
}
