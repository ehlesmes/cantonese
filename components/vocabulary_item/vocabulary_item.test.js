import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyItem } from "./vocabulary_item.js";
import { Tooltip } from "../ui/tooltip/tooltip.js";
import { SrsBadge } from "../ui/srs_badge/srs_badge.js";
import { Button } from "../ui/button/button.js";
import * as tts from "../shared/tts.js";
import { ValidationError } from "../shared/validation_error.js";

describe("VocabularyItem Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if data is missing required fields", () => {
      expect(() => new VocabularyItem({})).toThrow(ValidationError);
    });
  });

  const mockData = {
    cantonese: "你好",
    romanization: "nei5 hou2",
    translation: "Hello",
    level: 3,
  };

  it("should render all components correctly", () => {
    const item = new VocabularyItem(mockData);
    const row = item.shadowRoot.querySelector(".vocab-row");
    expect(row).toBeTruthy();

    // Check SRS Badge
    const badge = row.querySelector("div");
    expect(badge.component).toBeInstanceOf(SrsBadge);
    expect(badge.component.level).toBe(3);

    // Check Tooltip (Cantonese + Romanization)
    const tooltip = row.querySelector("div:nth-child(2)");
    expect(tooltip.component).toBeInstanceOf(Tooltip);
    expect(item.shadowRoot.querySelector(".cantonese-text").textContent).toBe("你好");
    expect(item.shadowRoot.querySelector(".romanization-text").textContent).toBe("nei5 hou2");

    // Check Translation
    expect(item.shadowRoot.querySelector(".translation-text").textContent).toBe("Hello");

    // Check Play Button
    const playBtn = row.querySelector(".play-btn");
    expect(playBtn.component).toBeInstanceOf(Button);
  });

  it("should trigger TTS when play button is clicked", () => {
    const spy = vi.spyOn(tts, "speakCantonese");
    const item = new VocabularyItem(mockData);
    const playBtn = item.shadowRoot.querySelector(".play-btn");

    playBtn.click();
    expect(spy).toHaveBeenCalledWith("你好");
  });
});
