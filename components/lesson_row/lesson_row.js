import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { StatusIcon } from "../status_icon/status_icon.js";

export class LessonRow extends Component {
  /**
   * @param {Object} data
   * @param {string} data.lessonId
   * @param {string} data.lessonName
   * @param {'not-started' | 'in-progress' | 'completed'} data.status
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["lessonId", "lessonName", "status"]);
    this._lessonId = data.lessonId;
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];
    this.render(data);
    this.setupEventListeners();
    this.status = data.status;
  }

  render(data) {
    const { lessonId, lessonName } = data;

    this._row = this.html("div", { className: "lesson-row" });

    this._statusIcon = new StatusIcon({ status: data.status });
    this._row.appendChild(this._statusIcon.element);

    const info = this.html("div", { className: "lesson-info" });
    const idEl = this.html("span", {
      className: "lesson-id",
      textContent: `Lesson ${lessonId}`,
    });
    const nameEl = this.html("span", {
      className: "lesson-name",
      textContent: lessonName,
    });

    info.appendChild(idEl);
    info.appendChild(nameEl);
    this._row.appendChild(info);

    const arrow = this.html("span", {
      className: "material-symbols-outlined arrow",
      textContent: "chevron_right",
    });
    this._row.appendChild(arrow);

    this.shadowRoot.appendChild(this._row);
  }

  setupEventListeners() {
    this._row.addEventListener("click", () => {
      this.dispatch("lesson-click", { lessonId: this._lessonId });
    });
  }

  get status() {
    return this._status;
  }

  set status(value) {
    this._status = value;
    this._row.className = `lesson-row ${value}`;
    this._statusIcon.status = value;
  }
}
