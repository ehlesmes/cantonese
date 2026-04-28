import { describe, it, expect, beforeEach, vi } from "vitest";
import { DialogPage } from "./dialog_page.js";
import * as tts from "../shared/tts.js";

describe("DialogPage", () => {
  let data;

  beforeEach(() => {
    document.body.replaceChildren();
    data = {
      lines: [
        {
          speaker: "A",
          cantonese: "你好",
          romanization: "nei5 hou2",
          translation: "Hello",
        },
        {
          speaker: "B",
          cantonese: "你好嗎？",
          romanization: "nei5 hou2 maa3?",
          translation: "How are you?",
        },
      ],
    };
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [{ lang: "zh-HK", name: "Alice" }],
    });
    // Mock getCantoneseVoiceCount to return 1 for fallback testing
    vi.spyOn(tts, "getCantoneseVoiceCount").mockReturnValue(1);
  });

  it("should show only the first line initially", () => {
    const component = new DialogPage(data);
    const lines = component.shadowRoot.querySelectorAll(".dialog-line");
    expect(lines.length).toBe(1);
    expect(component.footer.primaryText).toBe("Next Line");
  });

  it("should show the next line when 'Next Line' is clicked", () => {
    const component = new DialogPage(data);
    component.handlePrimaryClick();

    const lines = component.shadowRoot.querySelectorAll(".dialog-line");
    expect(lines.length).toBe(2);
    expect(component.footer.primaryText).toBe("Continue");
  });

  it("should dispatch dialog-complete when clicking continue on the last line", () => {
    const component = new DialogPage(data);
    const spy = vi.fn();
    component.element.addEventListener("dialog-complete", spy);

    component.handlePrimaryClick(); // Show line 2
    component.handlePrimaryClick(); // Complete

    expect(spy).toHaveBeenCalled();
  });

  describe("Validation", () => {
    it("should throw ValidationError if lines are missing", () => {
      expect(() => new DialogPage({})).toThrow("Missing property: lines");
    });
  });

  it("should apply fallback voice config for Speaker B if only 1 voice exists", () => {
    const component = new DialogPage(data);
    component.handlePrimaryClick(); // Show line 2 (Speaker B)

    const lines = component.shadowRoot.querySelectorAll(".dialog-line");
    const lineB = lines[1].component;

    expect(lineB._voiceConfig.pitch).toBe(0.8);
    expect(lineB._voiceConfig.rate).toBe(0.8);
  });
});
