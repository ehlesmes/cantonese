import { Component } from "../shared/component.js";
import { LessonHeader } from "../lesson_header/lesson_header.js";
import { PageRegistry } from "../shared/page_registry.js";
import { Progress } from "../shared/progress.js";
import { ExerciseProvider } from "../shared/exercise_provider.js";

// Import pages to trigger registration
import "../reading_page/reading_page.js";
import "../unscramble_page/unscramble_page.js";
import "../practice_summary_page/practice_summary_page.js";
import "../practice_empty_page/practice_empty_page.js";

export class PracticeViewer extends Component {
  constructor() {
    super(import.meta.url);

    this._session = [];
    this._currentIndex = 0;
    this._score = 0;

    this.render();
    this.setupEventListeners();

    this._startNewSession();
  }

  render() {
    this._container = this.html("div", { className: "practice-container" });

    this._header = new LessonHeader({
      lessonName: "Practice Session",
      hideNavigation: true,
    });
    this._header.element.id = "header";
    this._container.appendChild(this._header.element);

    this._main = this.html("main", { id: "m" });
    this._container.appendChild(this._main);

    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {
    // Results from exercise pages
    this.element.addEventListener("reading-result", (e) =>
      this._handleResult(e),
    );
    this.element.addEventListener("unscramble-result", (e) =>
      this._handleResult(e),
    );

    // Summary page events
    this.element.addEventListener("retry-practice", () =>
      this._startNewSession(),
    );

    // Global events
    this.element.addEventListener("close", () => this.dispatch("go-home"));
  }

  _startNewSession() {
    this._session = Progress.getPracticeSession();
    this._currentIndex = 0;
    this._score = 0;

    if (this._session.length === 0) {
      this._showPage("practice-empty");
    } else {
      this._renderCurrentExercise();
    }
  }

  _showPage(type, data = {}) {
    const PageClass = PageRegistry.get(type);
    if (!PageClass) {
      const error = this.html("div", {
        className: "error",
        textContent: `Unknown page type: ${type}`,
      });
      this._main.replaceChildren(error);
      return;
    }

    const pageInstance = new PageClass(data);
    this._main.replaceChildren(pageInstance.element);
    this._main.scrollTop = 0;
  }

  async _renderCurrentExercise() {
    const exerciseId = this._session[this._currentIndex];
    this._header.progress = this._currentIndex / this._session.length;

    const loading = this.html("div", {
      className: "loading",
      textContent: "Loading exercise...",
    });
    this._main.replaceChildren(loading);

    try {
      const data = await ExerciseProvider.getExercise(exerciseId);
      this._showPage(data.type, data);
    } catch (e) {
      console.error("🚨 [PracticeViewer ERROR]:", e);
      const error = this.html("div", {
        className: "error",
        textContent: `Error: ${e.message}`,
      });
      this._main.replaceChildren(error);
    }
  }

  _handleResult(e) {
    const isCorrect = e.detail.success;
    const exerciseId = this._session[this._currentIndex];

    Progress.updatePracticeResult(exerciseId, isCorrect);

    if (isCorrect) {
      this._score++;
    }

    this._currentIndex++;
    if (this._currentIndex < this._session.length) {
      this._renderCurrentExercise();
    } else {
      this._showSummary();
    }
  }

  _showSummary() {
    this._header.progress = 1;
    this._showPage("practice-summary", {
      score: this._score,
      total: this._session.length,
    });
  }
}
