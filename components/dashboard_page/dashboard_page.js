import { Component } from "../shared/component.js";
import { Routes } from "../shared/routes.js";
import { Progress } from "../shared/progress.js";
import { LessonProvider } from "../shared/lesson_provider.js";
import { ActionCard } from "../action_card/action_card.js";
import { ChapterAccordion } from "../chapter_accordion/chapter_accordion.js";

export class DashboardPage extends Component {
  constructor() {
    super(import.meta.url);
    this._nextLesson = null;
    this._chapters = [];

    this.render();
    this.setupEventListeners();
    this.loadData();
  }

  render() {
    this._container = this.html("div", { className: "dashboard-container" });

    // 1. Hero Section Setup
    this._heroSlot = this.html("section", { className: "hero-section" });
    this._heroSlot.appendChild(
      this.html("div", {
        className: "loading-placeholder",
        textContent: "Loading actions...",
      }),
    );

    // 2. Roadmap Section Setup
    const roadmapTitle = this.html("h2", {
      className: "section-title",
      textContent: "Learning Roadmap",
    });

    this._roadmapSlot = this.html("div", { className: "roadmap-container" });
    this._roadmapSlot.appendChild(
      this.html("div", {
        className: "loading-placeholder",
        textContent: "Loading roadmap...",
      }),
    );

    this._container.appendChild(this._heroSlot);
    this._container.appendChild(roadmapTitle);
    this._container.appendChild(this._roadmapSlot);

    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {
    // Event delegation for cards and roadmap items
    this._container.addEventListener("action-click", (e) => {
      const cardId = e.target.id;

      if (cardId === "practice-card") {
        window.location.hash = Routes.PRACTICE;
      } else if (cardId === "next-lesson-card") {
        const id = this._nextLesson
          ? this._nextLesson.lessonId
          : this._chapters[0]?.lessons[0].lessonId;
        if (id) {
          Progress.startLesson(id, true);
          window.location.hash = Routes.lesson(id);
        }
      }
    });

    this._container.addEventListener("lesson-click", (e) => {
      const id = e.detail.lessonId;
      Progress.startLesson(id, true);
      window.location.hash = Routes.lesson(id);
    });
  }

  async loadData() {
    try {
      const data = await LessonProvider.getManifest();
      this._chapters = data.chapters;
      this.updateContent();
    } catch (e) {
      console.error("Failed to load dashboard data", e);
      this._heroSlot.replaceChildren(
        this.html("div", {
          className: "loading-placeholder",
          textContent: "Error loading dashboard.",
        }),
      );
      this._roadmapSlot.replaceChildren();
    }
  }

  updateContent() {
    const state = Progress._getState();
    const progress = state.lessons;
    const activeLesson = state.activeLesson;
    this._nextLesson = Progress.getNextLesson(this._chapters);
    const practiceCount = Progress.getPracticeCount();

    // 1. Update Hero Section
    const nextLessonData = this._nextLesson
      ? {
          id: "next-lesson-card",
          title: "Next Lesson",
          description: this._nextLesson.lessonName,
        }
      : {
          id: "next-lesson-card",
          title: "All Caught Up!",
          description: "You've finished all available lessons.",
        };

    const nextCard = new ActionCard(nextLessonData);
    const practiceCard = new ActionCard({
      id: "practice-card",
      title: "Practice Review",
      description: `${practiceCount} exercises in rotation`,
    });

    this._heroSlot.replaceChildren(nextCard.element, practiceCard.element);

    // 2. Update Roadmap Section
    const accordion = new ChapterAccordion({
      chapters: this._chapters,
      progress,
      activeLesson,
      activeChapterId: this._nextLesson?.chapterId,
    });

    this._roadmapSlot.replaceChildren(accordion.element);
  }
}

Routes.register(Routes.HOME, DashboardPage);
