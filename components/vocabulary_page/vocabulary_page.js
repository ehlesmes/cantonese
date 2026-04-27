import { Component } from "../shared/component.js";
import { PageRegistry } from "../shared/page_registry.js";
import { Progress } from "../shared/progress.js";
import { ExampleCard } from "../example_card/example_card.js";
import { SrsBadge } from "../ui/srs_badge/srs_badge.js";

export class VocabularyPage extends Component {
  constructor() {
    super(import.meta.url);

    this.render();
    this.loadData();
  }

  render() {
    this._container = this.html("div", { className: "vocabulary-container" });

    this._list = this.html("div", { className: "vocab-list" });
    this._list.appendChild(
      this.html("div", {
        className: "empty-state",
        textContent: "Loading vocabulary...",
      }),
    );

    this._container.appendChild(this._list);
    this.shadowRoot.appendChild(this._container);
  }

  async loadData() {
    const practiceItems = Progress.getAllPracticeExercises();

    if (practiceItems.length === 0) {
      this._list.replaceChildren(
        this.html("div", {
          className: "empty-state",
          textContent:
            "No vocabulary unlocked yet. Complete lessons to build your list!",
        }),
      );
      return;
    }

    try {
      // Fetch all exercises in parallel
      const exercises = await Promise.all(
        practiceItems.map(async (item) => {
          try {
            const response = await fetch(`data/exercises/${item.exerciseId}`);
            if (!response.ok)
              throw new Error(`Failed to fetch ${item.exerciseId}`);
            const data = await response.json();
            return { ...data, level: item.level };
          } catch (e) {
            console.warn(`Error loading exercise ${item.exerciseId}`, e);
            return null;
          }
        }),
      );

      this.updateList(exercises.filter((ex) => ex !== null));
    } catch (e) {
      console.error("Failed to load vocabulary data", e);
      this._list.replaceChildren(
        this.html("div", {
          className: "empty-state",
          textContent: "Error loading vocabulary.",
        }),
      );
    }
  }

  updateList(exercises) {
    this._list.replaceChildren();

    exercises.forEach((ex) => {
      const cardContainer = this.html("div", { className: "card-container" });

      // Handle both Reading and Unscramble formats
      const cardData = {
        cantonese:
          ex.cantonese || ex.tokens?.map((t) => t[0]).join("") || "Error",
        romanization:
          ex.romanization || ex.tokens?.map((t) => t[1]).join(" ") || "Error",
        translation: ex.translation || "Error",
      };

      const card = new ExampleCard(cardData);
      cardContainer.appendChild(card.element);

      const badgeOverlay = this.html("div", { className: "badge-overlay" });
      const badge = new SrsBadge({ level: ex.level });
      badgeOverlay.appendChild(badge.element);
      cardContainer.appendChild(badgeOverlay);

      this._list.appendChild(cardContainer);
    });
  }
}

PageRegistry.set("vocabulary", VocabularyPage);
