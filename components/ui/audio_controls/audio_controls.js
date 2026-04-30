import { Component } from "../../shared/component.js";
import { Button } from "../button/button.js";

/**
 * AudioControls Component
 * Provides a set of buttons to play audio at normal and slow speeds.
 */
export class AudioControls extends Component {
  /**
   * @param {Object} data
   * @param {Function} data.onPlay - Callback for normal speed play
   * @param {Function} data.onPlaySlow - Callback for slow speed play
   */
  constructor(data) {
    super(import.meta.url);
    this.validate(data, ["onPlay", "onPlaySlow"]);
    this._onPlay = data.onPlay;
    this._onPlaySlow = data.onPlaySlow;

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.addStyles("./style.css", import.meta.url);

    this._container = this.html("div", { className: "audio-controls" });

    this._playBtn = new Button({
      title: "Play Audio",
      icon: "volume_up",
    });
    this._playBtn.element.id = "play-audio";

    this._playSlowBtn = new Button({
      title: "Play Slower",
      icon: "slow_motion_video",
    });
    this._playSlowBtn.element.id = "play-audio-slow";

    this._container.append(this._playBtn.element, this._playSlowBtn.element);
    this.shadowRoot.appendChild(this._container);
  }

  setupEventListeners() {
    this._playBtn.element.addEventListener("click", () => this._onPlay());
    this._playSlowBtn.element.addEventListener("click", () => this._onPlaySlow());
  }
}
