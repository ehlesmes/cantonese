import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { LessonRow } from "../lesson_row/lesson_row.js";

export class ChapterItem extends Component {
  /**
   * @param {Object} data
   * @param {string} data.chapterId
   * @param {string} data.chapterName
   * @param {Array} data.lessons
   * @param {Object} data.progress - Object mapping lessonId to { completed, lastPageIndex }
   * @param {boolean} [data.open=false]
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["chapterId", "chapterName", "lessons", "progress"]);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];
    this.render(data);
  }

  render(data) {
    const { chapterName, lessons, progress, open } = data;

    const details = this.html("details", { open: Boolean(open) });
    const summary = this.html("summary");

    const info = this.html("div", { className: "chapter-info" });
    info.appendChild(
      this.html("span", {
        className: "chapter-name",
        textContent: chapterName,
      }),
    );

    summary.appendChild(info);
    summary.appendChild(
      this.html("span", {
        className: "material-symbols-outlined expand-icon",
        textContent: "expand_more",
      }),
    );

    details.appendChild(summary);

    const lessonList = this.html("div", { className: "lesson-list" });
    lessons.forEach((lesson) => {
      const lessonProgress = progress[lesson.lessonId] || {};
      const status = lessonProgress.completed
        ? "completed"
        : lessonProgress.lastPageIndex > 0
          ? "in-progress"
          : "not-started";

      const row = new LessonRow({
        lessonId: lesson.lessonId,
        lessonName: lesson.lessonName,
        status,
      });
      lessonList.appendChild(row.element);
    });

    details.appendChild(lessonList);
    this.shadowRoot.appendChild(details);
  }
}
