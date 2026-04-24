import { describe, it, expect, beforeEach, vi } from "vitest";
import "./reading_page.js";

describe("ReadingPage Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("reading-page");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("reading-page")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should propagate data to the reading-exercise component", () => {
    element.data = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };

    const exercise = element.shadowRoot.getElementById("exercise");
    expect(exercise.data.cantonesePhrase).toBe("你好");
    expect(exercise.data.romanization).toBe("nei5 hou2");
    expect(exercise.data.translation).toBe("Hello");
  });

  it("should correctly return internal state via the data getter", () => {
    const testData = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    element.data = testData;
    expect(element.data).toEqual(testData);
  });

  it("should reveal the answer when primary button is clicked in initial state", () => {
    element.data = { translation: "Hello" };
    const footer = element.shadowRoot.getElementById("footer");
    const exercise = element.shadowRoot.getElementById("exercise");

    // Initial state
    expect(footer.primaryText).toBe("Reveal Answer");
    expect(exercise.data.translationHidden).toBe(true);

    // Click reveal
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    // Revealed state
    expect(footer.primaryText).toBe("Got it right");
    expect(footer.secondaryText).toBe("Need practice");
    expect(exercise.data.translationHidden).toBe(false);
  });

  it("should dispatch reading-result when clicked in revealed state", () => {
    const footer = element.shadowRoot.getElementById("footer");

    // Move to revealed state
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    const resultSpy = vi.fn();
    element.addEventListener("reading-result", resultSpy);

    // Click "Got it right"
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );
    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);

    // Click "Need practice"
    footer.dispatchEvent(
      new CustomEvent("secondary-click", { bubbles: true, composed: true }),
    );
    expect(resultSpy).toHaveBeenCalledTimes(2);
    expect(resultSpy.mock.calls[1][0].detail.success).toBe(false);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      document.body.innerHTML = "";
      element = document.createElement("reading-page");
      document.body.appendChild(element);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Missing required data property 'cantonesePhrase'",
        ),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Missing required data property 'romanization'",
        ),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property 'translation'"),
      );

      consoleSpy.mockRestore();
    });
  });
});
