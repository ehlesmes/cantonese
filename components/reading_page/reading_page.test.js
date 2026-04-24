import { describe, it, expect, beforeEach, vi } from "vitest";
import "./reading_page.js";

describe("ReadingPage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("reading-page");
    el.data = {
      cantonesePhrase: "test",
      romanization: "test",
      translation: "test",
    };
    document.body.appendChild(el);
    expect(customElements.get("reading-page")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should propagate data to the reading-exercise component", () => {
    const el = document.createElement("reading-page");
    el.data = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    document.body.appendChild(el);

    const exercise = el.shadowRoot.getElementById("exercise");
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
    const el = document.createElement("reading-page");
    el.data = testData;
    document.body.appendChild(el);
    expect(el.data).toEqual(testData);
  });

  it("should reveal the answer when primary button is clicked in initial state", () => {
    const el = document.createElement("reading-page");
    el.data = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    document.body.appendChild(el);

    const footer = el.shadowRoot.getElementById("footer");
    const exercise = el.shadowRoot.getElementById("exercise");

    // Initial state
    expect(footer.data.primaryText).toBe("Reveal Answer");
    expect(exercise.data.translationHidden).toBe(true);

    // Click reveal
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    // Revealed state
    expect(footer.data.primaryText).toBe("Got it right");
    expect(footer.data.secondaryText).toBe("Need practice");
    expect(exercise.data.translationHidden).toBe(false);
  });

  it("should dispatch reading-result when clicked in revealed state", () => {
    const el = document.createElement("reading-page");
    el.data = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    document.body.appendChild(el);

    const footer = el.shadowRoot.getElementById("footer");

    // Move to revealed state
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    const resultSpy = vi.fn();
    el.addEventListener("reading-result", resultSpy);

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
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("reading-page");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("reading-page");
      el.data = {
        cantonesePhrase: "你好",
        romanization: "nei5",
        translation: "hello",
      };
      document.body.appendChild(el);
      const exercise = el.shadowRoot.getElementById("exercise");
      expect(exercise.data.cantonesePhrase).toBe("你好");
    });
  });
});
