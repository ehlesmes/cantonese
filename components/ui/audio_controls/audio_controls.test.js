import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioControls } from "./audio_controls.js";

describe("AudioControls Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should be defined", () => {
    const component = new AudioControls({
      onPlay: () => {},
      onPlaySlow: () => {},
    });
    expect(component).toBeInstanceOf(AudioControls);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should call onPlay when normal play button is clicked", () => {
    const playSpy = vi.fn();
    const component = new AudioControls({
      onPlay: playSpy,
      onPlaySlow: () => {},
    });

    const playBtn = component.shadowRoot.getElementById("play-audio");
    playBtn.click();

    expect(playSpy).toHaveBeenCalled();
  });

  it("should call onPlaySlow when slow play button is clicked", () => {
    const playSlowSpy = vi.fn();
    const component = new AudioControls({
      onPlay: () => {},
      onPlaySlow: playSlowSpy,
    });

    const playSlowBtn = component.shadowRoot.getElementById("play-audio-slow");
    playSlowBtn.click();

    expect(playSlowSpy).toHaveBeenCalled();
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new AudioControls({});
      }).toThrow();
    });
  });
});
