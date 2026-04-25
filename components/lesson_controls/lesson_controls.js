import { Component } from "../shared/component.js";
import { iconStyles } from "../shared/shared_assets.js";
import { IconButton } from "../ui/icon_button/icon_button.js";

/**
 * LessonControls Component
 * A reusable UI element for lesson navigation and actions.
 */
export class LessonControls extends Component {
  constructor(config = {}) {
    super(config, import.meta.url);
    this.shadowRoot.adoptedStyleSheets = [iconStyles];

    this._container = document.createElement("div");
    this._container.className = "controls";

    this._restartBtn = new IconButton({
      title: "Restart Lesson",
      icon: "restart_alt",
    });
    this._restartBtn.element.id = "restart";
    this._container.appendChild(this._restartBtn.element);

    const divider1 = document.createElement("div");
    divider1.className = "divider";
    this._container.appendChild(divider1);

    this._prevBtn = new IconButton({
      title: "Previous Page",
      icon: "arrow_back",
    });
    this._prevBtn.element.id = "prev";
    this._container.appendChild(this._prevBtn.element);

    this._nextBtn = new IconButton({
      title: "Next Page",
      icon: "arrow_forward",
    });
    this._nextBtn.element.id = "next";
    this._container.appendChild(this._nextBtn.element);

    const divider2 = document.createElement("div");
    divider2.className = "divider";
    this._container.appendChild(divider2);

    this._closeBtn = new IconButton({
      title: "Close",
      icon: "close",
    });
    this._closeBtn.element.id = "close";
    this._container.appendChild(this._closeBtn.element);

    this.shadowRoot.appendChild(this._container);

    // Setup event listeners
    this._restartBtn.element.onclick = () => this.dispatch("restart");
    this._prevBtn.element.onclick = () => this.dispatch("prev");
    this._nextBtn.element.onclick = () => this.dispatch("next");
    this._closeBtn.element.onclick = () => this.dispatch("close");
  }
}
