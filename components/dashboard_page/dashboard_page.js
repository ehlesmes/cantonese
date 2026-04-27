import { Component } from "../shared/component.js";
import { PageRegistry } from "../shared/page_registry.js";
import { Progress } from "../shared/progress.js";
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
    this.element.addEventListener("action-click", (e) => {
      const cardId = e.target.id;

      if (cardId === "practice-card") {
        window.location.hash = "#/practice";
      } else if (cardId === "next-lesson-card") {
        const id = this._nextLesson
          ? this._nextLesson.lessonId
          : this._chapters[0]?.lessons[0].id;
        if (id) window.location.hash = `#/lesson/${id}`;
      }
    });

    this.element.addEventListener("lesson-click", (e) => {
      window.location.hash = `#/lesson/${e.detail.lessonId}`;
    });
  }

  async loadData() {
    try {
      const response = await fetch("data/lessons.json");
      if (!response.ok) throw new Error("Failed to fetch lessons.json");
      const data = await response.json();
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
    this._nextLesson = Progress.getNextLesson(this._chapters);
    const practiceCount = Progress.getPracticeCount();

    // 1. Update Hero Section
    const nextLessonData = this._nextLesson
      ? {
          id: "next-lesson-card",
          title: "Next Lesson",
          description: this._nextLesson.lessonName,
          icon: "play_arrow",
          actionText: "Start",
        }
      : {
          id: "next-lesson-card",
          title: "All Caught Up!",
          description: "You've finished all available lessons.",
          icon: "check_circle",
          actionText: "Review",
        };

    const nextCard = new ActionCard(nextLessonData);
    const practiceCard = new ActionCard({
      id: "practice-card",
      title: "Practice Review",
      description: `${practiceCount} exercises ready for review`,
      icon: "fitness_center",
      actionText: "Practice",
    });

    this._heroSlot.replaceChildren(nextCard.element, practiceCard.element);

    // 2. Update Roadmap Section
    const accordion = new ChapterAccordion({
      chapters: this._chapters,
      progress,
      activeChapterId: this._nextLesson?.chapterId,
    });

    this._roadmapSlot.replaceChildren(accordion.element);
  }
}

PageRegistry.set("home", DashboardPage);
