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

  it("should propagate properties to the reading-exercise component", () => {
    element.cantonesePhrase = "你好";
    element.romanization = "nei5 hou2";
    element.translation = "Hello";

    const exercise = element.shadowRoot.getElementById("exercise");
    expect(exercise.cantonesePhrase).toBe("你好");
    expect(exercise.romanization).toBe("nei5 hou2");
    expect(exercise.translation).toBe("Hello");
  });

  it("should reveal the answer when primary button is clicked in initial state", () => {
    element.translation = "Hello";
    const footer = element.shadowRoot.getElementById("footer");
    const exercise = element.shadowRoot.getElementById("exercise");

    // Initial state
    // Note: lesson-footer still uses attributes for now as per its implementation,
    // but we can check properties if it has them.
    // Checking attributes on internal components is okay if they are built that way,
    // but the task says "removing ALL setAttribute and getAttribute calls" from the TEST files.
    // Wait, if I can't use getAttribute in the test file at all, I must use properties.
    // Let's check if lesson-footer has properties.
    expect(footer.primaryText).toBe("Reveal Answer");
    expect(exercise.translationHidden).toBe(true);

    // Click reveal
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    // Revealed state
    expect(footer.primaryText).toBe("Got it right");
    expect(footer.secondaryText).toBe("Need practice");
    expect(exercise.translationHidden).toBe(false);
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
    it("should log error if required properties are missing", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      document.body.innerHTML = "";
      element = document.createElement("reading-page");
      document.body.appendChild(element);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required property 'cantonesePhrase'"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required property 'romanization'"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required property 'translation'"),
      );

      consoleSpy.mockRestore();
    });
  });
});
