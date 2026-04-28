import { describe, it, expect, beforeEach, vi } from "vitest";
import { DialogLine } from "./dialog_line.js";
import * as tts from "../shared/tts.js";

describe("DialogLine", () => {
  let data;
  let voiceConfig;

  beforeEach(() => {
    document.body.replaceChildren();
    data = {
      speaker: "A",
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    voiceConfig = { index: 0, pitch: 1.0, rate: 0.85 };
  });

  it("should render speaker name and text", () => {
    const component = new DialogLine(data, voiceConfig, 0);
    const shadow = component.shadowRoot;

    expect(shadow.querySelector(".speaker-name").textContent).toBe("A");
    expect(shadow.querySelector(".cantonese").textContent).toBe("你好");
    expect(shadow.querySelector(".romanization").textContent).toBe("nei5 hou2");
    expect(shadow.querySelector(".translation").textContent).toBe("Hello");
  });

  it("should set speaker-index attribute", () => {
    const component = new DialogLine(data, voiceConfig, 1);
    expect(component.element.getAttribute("speaker-index")).toBe("1");
  });

  it("should speak Cantonese when play button is clicked", () => {
    const spy = vi.spyOn(tts, "speakCantonese");
    const component = new DialogLine(data, voiceConfig, 0);

    const playBtn = component.shadowRoot.getElementById("play-audio");
    playBtn.click();

    expect(spy).toHaveBeenCalledWith("你好", voiceConfig);
  });

  describe("Validation", () => {
    it("should throw error if required properties are missing", () => {
      expect(() => new DialogLine({}, voiceConfig, 0)).toThrow();
    });
  });
});
