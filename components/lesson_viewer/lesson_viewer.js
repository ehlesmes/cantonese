import { Component } from "../shared/component.js";
import { LessonHeader } from "../lesson_header/lesson_header.js";
import { PageRegistry } from "../shared/page_registry.js";
import { Progress } from "../shared/progress.js";
import { LessonProvider } from "../shared/lesson_provider.js";
import { ExerciseProvider } from "../shared/exercise_provider.js";

// Import pages only to trigger their self-registration in PageRegistry
import "../reading_page/reading_page.js";
import "../unscramble_page/unscramble_page.js";
import "../explanation_page/explanation_page.js";
import "../congratulations_page/congratulations_page.js";

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
    this._pages = [];
    this._currentPageIndex = 0;

    this.render({ lessonName });
    this.setupEventListeners();

    this._loadPromise = this._loadLesson(this._lessonId);
  }
  render(data) {
    this._container = this.html("div", { className: "lesson-container" });

    this._header = new LessonHeader({ lessonName: data.lessonName });
    this._header.element.id = "header";
    this._container.appendChild(this._header.element);

    this._main = this.html("main", { id: "m" });
    this._container.appendChild(this._main);

    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {
    // Internal Event Listeners
    this.element.addEventListener("restart", () => this.navigateTo(0));
    this.element.addEventListener("prev", () =>
      this.navigateTo(this._currentPageIndex - 1),
    );
    this.element.addEventListener("next", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );

    // Page Event Listeners
    const nextHandler = () => this.navigateTo(this._currentPageIndex + 1);
    this._main.addEventListener("reading-result", nextHandler);
    this._main.addEventListener("unscramble-result", nextHandler);
    this.element.addEventListener("explanation-complete", nextHandler);

    this.element.addEventListener("go-home", () => {
      this.dispatch("close");
    });
  }

  /**
   * Returns a promise that resolves when the current loading task is complete.
   */
  get ready() {
    return this._loadPromise;
  }

  async _loadLesson(lessonId) {
    try {
      const data = await LessonProvider.getLessonData(lessonId);
      this._pages = data.pages;
      this._currentPageIndex = Progress.getLessonProgress(this._lessonId);

      // Ensure index is within bounds
      if (this._currentPageIndex >= this._pages.length) {
        this._currentPageIndex = 0;
      }

      await this._renderPage(this._currentPageIndex);
      this._prefetchExercises();
    } catch (e) {
      console.error("🚨 [LessonViewer ERROR]: Failed to load lesson data", e);
    }
  }

  _prefetchExercises() {
    if (!this._pages) return;
    const [chapter, lessonNum] = this._lessonId.split(".");

    const paths = this._pages
      .filter((p) => p.type === "reading" || p.type === "unscramble")
      .map((p) => `${chapter}/${lessonNum}/${p.pageId}.json`);

    ExerciseProvider.prefetch(paths);
  }

  async _renderPage(index) {
    if (!this._pages || index < 0 || index >= this._pages.length) {
      return;
    }

    const pageDef = this._pages[index];

    const loading = this.html("div", {
      className: "loading",
      textContent: "Loading...",
    });
    this._main.replaceChildren(loading);

    let pageData;
    if (pageDef.type === "explanation") {
      pageData = { content: pageDef.content };
    } else if (pageDef.type === "congratulations") {
      pageData = { ...pageDef };
      // Mark lesson as completed and add exercises to practice
      Progress.completeLesson(this._lessonId);
      const [chapter, lessonNum] = this._lessonId.split(".");
      const exerciseIds = this._pages
        .filter((p) => p.type === "reading" || p.type === "unscramble")
        .map((p) => `${chapter}/${lessonNum}/${p.pageId}.json`);
      Progress.addExercisesToPractice(exerciseIds);
    } else {
      try {
        const [chapter, lessonNum] = this._lessonId.split(".");
        const path = `${chapter}/${lessonNum}/${pageDef.pageId}.json`;
        pageData = await ExerciseProvider.getExercise(path);
      } catch {
        const error = this.html("div", {
          className: "error",
          textContent: `Failed to load page: ${pageDef.pageId}`,
        });
        this._main.replaceChildren(error);
        return;
      }
    }

    const PageClass = PageRegistry.get(pageDef.type);
    if (!PageClass) {
      const error = this.html("div", {
        className: "error",
        textContent: `Unknown page type: ${pageDef.type}`,
      });
      this._main.replaceChildren(error);
      return;
    }

    try {
      const pageInstance = new PageClass(pageData);
      this._main.replaceChildren(pageInstance.element);
      this._main.scrollTop = 0;

      // Update progress in header
      const progress = (index + 1) / this._pages.length;
      this._header.progress = progress;
    } catch (e) {
      console.error("🚨 [LessonViewer ERROR]: Failed to render page", e);
      const error = this.html("div", {
        className: "error",
        textContent: `Failed to render page: ${e.message}`,
      });
      this._main.replaceChildren(error);
    }
  }

  navigateTo(index) {
    if (!this._pages) return Promise.resolve();
    if (index < 0 || index >= this._pages.length) {
      console.warn("End of lesson or out of bounds navigation attempted");
      return Promise.resolve();
    }
    this._currentPageIndex = index;
    Progress.saveLessonProgress(this._lessonId, index);
    this._loadPromise = this._renderPage(index);
    return this._loadPromise;
  }
}
