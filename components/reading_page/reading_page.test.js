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

    expect(component._exercise.data.cantonese).toBe("你好");
    expect(component._exercise.data.romanization).toBe("nei5 hou2");
    expect(component._exercise.data.translation).toBe("Hello");
  });

  it("should reveal the answer when primary button is clicked in initial state", () => {
    const component = new ReadingPage({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });

    const footer = component._footer;
    const exercise = component._exercise;

    // Initial state
    expect(footer.data.primaryText).toBe("Reveal Answer");
    expect(exercise.data.translationHidden).toBe(true);

    // Click reveal
    footer.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    // Revealed state
    expect(footer.data.primaryText).toBe("Got it right");
    expect(footer.data.secondaryText).toBe("Need practice");
    expect(exercise.data.translationHidden).toBe(false);
  });

  it("should dispatch reading-result when clicked in revealed state", () => {
    const component = new ReadingPage({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });

    const footer = component._footer;

    // Move to revealed state
    footer.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    const resultSpy = vi.fn();
    component.element.addEventListener("reading-result", resultSpy);

    // Click "Got it right"
    footer.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );
    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);

    // Click "Need practice"
    footer.element.dispatchEvent(
      new CustomEvent("secondary-click", { bubbles: true, composed: true }),
    );
    expect(resultSpy).toHaveBeenCalledTimes(2);
    expect(resultSpy.mock.calls[1][0].detail.success).toBe(false);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      new ReadingPage({ data: {} });

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });
});
