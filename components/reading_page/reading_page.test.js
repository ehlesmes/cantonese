import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReadingPage } from "./reading_page.js";

describe("ReadingPage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new ReadingPage({
      cantonese: "test",
      romanization: "test",
      translation: "test",
    });
    expect(component).toBeInstanceOf(ReadingPage);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should propagate data to the reading-exercise component", () => {
    const component = new ReadingPage({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });

    expect(
      component.shadowRoot.querySelector("#exercise").shadowRoot.textContent,
    ).toBe("你好nei5 hou2volume_upHello");
  });

  it("should reveal the answer when primary button is clicked in initial state", () => {
    const component = new ReadingPage({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });

    const footerEl = component.querySelector("#footer");
    const exerciseEl = component.querySelector("#exercise");

    const primaryBtn = footerEl.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = footerEl.shadowRoot.getElementById("secondary-btn");
    const translation =
      exerciseEl.shadowRoot.querySelector(".translation-text");

    // Initial state
    expect(primaryBtn.textContent).toBe("Reveal Answer");
    expect(secondaryBtn.classList.contains("hidden")).toBe(true);
    expect(translation.classList.contains("hidden")).toBe(true);

    // Click reveal
    primaryBtn.click();

    // Revealed state
    expect(primaryBtn.textContent).toBe("Got it right");
    expect(secondaryBtn.textContent).toBe("Need practice");
    expect(secondaryBtn.classList.contains("hidden")).toBe(false);
    expect(translation.classList.contains("hidden")).toBe(false);
  });

  it("should dispatch reading-result when clicked in revealed state", () => {
    const component = new ReadingPage({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });

    const footerEl = component.querySelector("#footer");
    const primaryBtn = footerEl.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = footerEl.shadowRoot.getElementById("secondary-btn");

    // Move to revealed state
    primaryBtn.click();

    const resultSpy = vi.fn();
    component.element.addEventListener("reading-result", resultSpy);

    // Click "Got it right" (primary)
    primaryBtn.click();
    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);

    // Click "Need practice" (secondary)
    secondaryBtn.click();
    expect(resultSpy).toHaveBeenCalledTimes(2);
    expect(resultSpy.mock.calls[1][0].detail.success).toBe(false);
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new ReadingPage({});
      }).toThrow();
    });
  });
});
