import { Component } from "../shared/component.js";
import { LessonControls } from "../lesson_controls/lesson_controls.js";
import { ValidationError } from "../shared/validation_error.js";

export class LessonHeader extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.data]
   * @param {string} [config.data.lessonName]
   */
  constructor(config = {}) {
    super(config, import.meta.url);

    const header = document.createElement("header");

    this._titleEl = document.createElement("div");
    this._titleEl.className = "title";
    this._titleEl.id = "lesson-title";
    this._titleEl.textContent = this._data.lessonName;
    header.appendChild(this._titleEl);

    this._controls = new LessonControls();
    header.appendChild(this._controls.element);

    this.shadowRoot.appendChild(header);
  }

  validate() {
    if (!this._data.lessonName) {
      throw new ValidationError(
        "🚨 [LessonHeader ERROR]: Missing required data property 'lessonName'!",
      );
    }
  }

  update() {
    this._titleEl.textContent = this._data.lessonName;
  }
}
