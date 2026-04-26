import { Component } from "../shared/component.js";
import { LessonHeader } from "../lesson_header/lesson_header.js";
import { PageRegistry } from "../shared/page_registry.js";

// Import pages only to trigger their self-registration in PageRegistry
import "../reading_page/reading_page.js";
import "../unscramble_page/unscramble_page.js";
import "../explanation_page/explanation_page.js";

export class LessonViewer extends Component {
  /**
   * @param {Object} data
   * @param {string} data.lessonId
   * @param {string} data.lessonName
   */
  constructor({ lessonId, lessonName }) {
    super(import.meta.url);

    this.validate({ lessonId, lessonName }, ["lessonId", "lessonName"]);

    this._lessonId = lessonId;
    this._lessonName = lessonName;

    this._container = document.createElement("div");
    this._container.className = "lesson-container";

    this._header = new LessonHeader({ lessonName: this._lessonName });
    this._header.element.id = "header";
    this._container.appendChild(this._header.element);

    this._main = document.createElement("main");
    this._main.id = "m";
    this._container.appendChild(this._main);

    this.shadowRoot.appendChild(this._container);

    this._lessonData = null;
    this._currentPageIndex = 0;
    this._pageCache = new Map();
    this._loadPromise = this._loadLesson(this._lessonId);

    // Internal Event Listeners
    this.element.addEventListener("restart", () => this.navigateTo(0));
    this.element.addEventListener("prev", () =>
      this.navigateTo(this._currentPageIndex - 1),
    );
    this.element.addEventListener("next", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
    this.element.addEventListener("close", () => {
      console.warn("Lesson closed (Main menu navigation not implemented)");
    });

    // Page Event Listeners
    this._main.addEventListener("reading-result", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
    this._main.addEventListener("unscramble-result", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
    this.element.addEventListener("explanation-complete", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
  }

  /**
   * Returns a promise that resolves when the current loading task is complete.
   */
  get ready() {
    return this._loadPromise;
  }

  async _loadLesson(lessonId) {
    try {
      const [chapter] = lessonId.split(".");
      const response = await fetch(`data/lessons/${chapter}/${lessonId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load lesson: ${lessonId}`);
      }

      this._lessonData = await response.json();
      this._currentPageIndex = 0;

      await this._renderPage(0);
      this._prefetchExercises();
    } catch (e) {
      console.error("🚨 [LessonViewer ERROR]: Failed to load lesson data", e);
    }
  }

  async _prefetchExercises() {
    if (!this._lessonData) return;
    const [chapter, lessonNum] = this._lessonId.split(".");

    for (const page of this._lessonData.pages) {
      if (page.type === "reading" || page.type === "unscramble") {
        const url = `data/exercises/${chapter}/${lessonNum}/${page.id}.json`;
        fetch(url)
          .then((res) => res.json())
          .then((data) => this._pageCache.set(page.id, data))
          .catch(() => console.warn(`Failed to prefetch exercise ${page.id}`));
      }
    }
  }

  async _renderPage(index) {
    if (
      !this._lessonData ||
      index < 0 ||
      index >= this._lessonData.pages.length
    ) {
      return;
    }

    const pageDef = this._lessonData.pages[index];

    this._main.innerHTML = "";
    const loading = document.createElement("div");
    loading.className = "loading";
    loading.textContent = "Loading...";
    this._main.appendChild(loading);

    let pageData;
    if (pageDef.type === "explanation") {
      pageData = { content: pageDef.content };
    } else {
      pageData = this._pageCache.get(pageDef.id);
      if (!pageData) {
        try {
          const [chapter, lessonNum] = this._lessonId.split(".");
          const response = await fetch(
            `data/exercises/${chapter}/${lessonNum}/${pageDef.id}.json`,
          );
          pageData = await response.json();
          this._pageCache.set(pageDef.id, pageData);
        } catch {
          this._main.innerHTML = "";
          const error = document.createElement("div");
          error.className = "error";
          error.textContent = `Failed to load page: ${pageDef.id}`;
          this._main.appendChild(error);
          return;
        }
      }
    }

    const PageClass = PageRegistry.get(pageDef.type);
    if (!PageClass) {
      this._main.innerHTML = "";
      const error = document.createElement("div");
      error.className = "error";
      error.textContent = `Unknown page type: ${pageDef.type}`;
      this._main.appendChild(error);
      return;
    }

    try {
      const pageInstance = new PageClass(pageData);
      this._main.innerHTML = "";
      this._main.appendChild(pageInstance.element);
      this._main.scrollTop = 0;
    } catch (e) {
      console.error("🚨 [LessonViewer ERROR]: Failed to render page", e);
      this._main.innerHTML = "";
      const error = document.createElement("div");
      error.className = "error";
      error.textContent = `Failed to render page: ${e.message}`;
      this._main.appendChild(error);
    }
  }

  navigateTo(index) {
    if (!this._lessonData) return Promise.resolve();
    if (index < 0 || index >= this._lessonData.pages.length) {
      console.warn("End of lesson or out of bounds navigation attempted");
      return Promise.resolve();
    }
    this._currentPageIndex = index;
    this._loadPromise = this._renderPage(index);
    return this._loadPromise;
  }
}
