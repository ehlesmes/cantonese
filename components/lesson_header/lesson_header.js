import { Component } from "/components/shared/component.js";
import { LessonControls } from "/components/lesson_controls/lesson_controls.js";

export class LessonHeader extends Component {
  /**
   * @param {Object} [options]
   * @param {string} [options.lessonName]
   */
  constructor(options = {}) {
    super("/components/lesson_header/style.css");

    const header = document.createElement("header");

    this._titleEl = document.createElement("div");
    this._titleEl.className = "title";
    this._titleEl.id = "lesson-title";
    this._titleEl.textContent = "Lesson";
    header.appendChild(this._titleEl);

    this._controls = new LessonControls();
    header.appendChild(this._controls.element);

    this.shadowRoot.appendChild(header);

    this.data = options;
  }

  validate() {
    if (!this._data.lessonName) {
      console.error(
        "🚨 [LessonHeader ERROR]: Missing required data property 'lessonName'!",
      );
    }
  }

  update() {
    this.validate();
    this._titleEl.textContent = this._data.lessonName || "";
  }
}
