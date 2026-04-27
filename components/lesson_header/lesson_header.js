import { Component } from "../shared/component.js";
import { LessonControls } from "../lesson_controls/lesson_controls.js";

export class LessonHeader extends Component {
  /**
   * @param {Object} [data]
   * @param {string} [data.lessonName]
   * @param {number} [data.progress] - Number between 0 and 1
   * @param {boolean} [data.hideNavigation]
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["lessonName"]);
    this._progress = 0;

    this.render(data);

    this.progress = data.progress || 0;
  }

  render(data) {
    const { lessonName, hideNavigation = false } = data;

    const headerContainer = this.html("div", { className: "header-container" });
    const header = this.html("header");

    this._titleEl = this.html("div", {
      className: "title",
      id: "lesson-title",
      textContent: lessonName,
    });
    header.appendChild(this._titleEl);

    this._controls = new LessonControls({ hideNavigation });
    this._controls.element.id = "controls";
    header.appendChild(this._controls.element);

    headerContainer.appendChild(header);

    this._progressContainer = this.html("div", {
      className: "progress-container",
    });
    this._progressBar = this.html("div", { className: "progress-bar" });
    this._progressContainer.appendChild(this._progressBar);
    headerContainer.appendChild(this._progressContainer);

    this.shadowRoot.appendChild(headerContainer);
  }

  get progress() {
    return this._progress;
  }

  set progress(value) {
    this._progress = Math.max(0, Math.min(1, value));
    const percentage = this._progress * 100;
    this._progressBar.style.width = `${percentage}%`;
  }
}
