import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { Button } from "../ui/button/button.js";

/**
 * LessonControls Component
 * A reusable UI element for lesson navigation and actions.
 */
export class LessonControls extends Component {
  /**
   * @param {Object} [config]
   * @param {boolean} [config.hideNavigation=false]
   */
  constructor(config = {}) {
    super(import.meta.url);
    this.validate(config);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      iconStyles,
    ];

    this._hideNavigation = config.hideNavigation || false;

    this.render();
    this.setupEventListeners();
  }

  render() {
    this._container = this.html("div", { className: "controls" });

    if (!this._hideNavigation) {
      this._restartBtn = new Button({
        title: "Restart Lesson",
        icon: "restart_alt",
      });
      this._restartBtn.element.id = "restart";
      this._container.appendChild(this._restartBtn.element);

      const divider1 = this.html("div", { className: "divider" });
      this._container.appendChild(divider1);

      this._prevBtn = new Button({
        title: "Previous Page",
        icon: "arrow_back",
      });
      this._prevBtn.element.id = "prev";
      this._container.appendChild(this._prevBtn.element);

      this._nextBtn = new Button({
        title: "Next Page",
        icon: "arrow_forward",
      });
      this._nextBtn.element.id = "next";
      this._container.appendChild(this._nextBtn.element);

      const divider2 = this.html("div", { className: "divider" });
      this._container.appendChild(divider2);
    }

    this._closeBtn = new Button({
      title: "Close",
      icon: "close",
    });
    this._closeBtn.element.id = "close";
    this._container.appendChild(this._closeBtn.element);

    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {
    if (!this._hideNavigation) {
      this._restartBtn.element.addEventListener("click", () =>
        this.dispatch("restart"),
      );
      this._prevBtn.element.addEventListener("click", () =>
        this.dispatch("prev"),
      );
      this._nextBtn.element.addEventListener("click", () =>
        this.dispatch("next"),
      );
    }
    this._closeBtn.element.addEventListener("click", () =>
      this.dispatch("close"),
    );
  }
}
