import { Component } from "../shared/component.js";
import { ChapterItem } from "../chapter_item/chapter_item.js";

export class ChapterAccordion extends Component {
  /**
   * @param {Object} data
   * @param {Array} data.chapters
   * @param {Object} data.progress - Object mapping lessonId to progress info
   * @param {string} [data.activeChapterId] - The ID of the chapter to open by default
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["chapters", "progress"]);
    this.render(data);
  }

  render(data) {
    const { chapters, progress, activeChapterId } = data;
    const container = this.html("div", { className: "chapter-accordion" });

    chapters.forEach((chapter, index) => {
      // Open the specified chapter, or the first one if none specified
      const isOpen = activeChapterId
        ? chapter.id === activeChapterId
        : index === 0;

      const item = new ChapterItem({
        ...chapter,
        progress,
        open: isOpen,
      });
      container.appendChild(item.element);
    });

    this.shadowRoot.appendChild(container);
  }
}
