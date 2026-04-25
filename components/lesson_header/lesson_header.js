import { Component } from "../shared/component.js";
import { LessonControls } from "../lesson_controls/lesson_controls.js";

export class LessonHeader extends Component {
  /**
   * @param {Object} [data]
   * @param {string} [data.lessonName]
   */
  constructor(data) {
    super(import.meta.url);

    this.validate(data, ['lessonName']);
    const {lessonName} = data;

    const header = document.createElement("header");

    this._titleEl = document.createElement("div");
    this._titleEl.className = "title";
    this._titleEl.id = "lesson-title";
    this._titleEl.textContent = lessonName;
    header.appendChild(this._titleEl);

    this._controls = new LessonControls();
    header.appendChild(this._controls.element);

    this.shadowRoot.appendChild(header);
  }
}
