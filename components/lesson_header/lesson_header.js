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
    this._data = data;

    this.render();
    this.setProgress(data.progress || 0);
  }

  render() {
    const { lessonName, hideNavigation = false } = this._data;

    const headerContainer = document.createElement("div");
    headerContainer.className = "header-container";

    const header = document.createElement("header");

    this._titleEl = document.createElement("div");
    this._titleEl.className = "title";
    this._titleEl.id = "lesson-title";
    this._titleEl.textContent = lessonName;
    header.appendChild(this._titleEl);

    this._controls = new LessonControls({ hideNavigation });
    header.appendChild(this._controls.element);

    headerContainer.appendChild(header);

    this._progressContainer = document.createElement("div");
    this._progressContainer.className = "progress-container";
    this._progressBar = document.createElement("div");
    this._progressBar.className = "progress-bar";
    this._progressContainer.appendChild(this._progressBar);
    headerContainer.appendChild(this._progressContainer);

    this.shadowRoot.appendChild(headerContainer);
  }

  /**
   * @param {number} value - Number between 0 and 1
   */
  setProgress(value) {
    const percentage = Math.max(0, Math.min(1, value)) * 100;
    this._progressBar.style.width = `${percentage}%`;
  }
}
