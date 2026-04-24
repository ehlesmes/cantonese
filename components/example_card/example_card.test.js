import { describe, it, expect, beforeEach, vi } from "vitest";
import "./example_card.js";

describe("ExampleCard Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("example-card");
    el.data = { cantonese: "test", romanization: "test", translation: "test" };
    document.body.appendChild(el);
    expect(customElements.get("example-card")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should display the Cantonese text, romanization, and translation via the data property", () => {
    const el = document.createElement("example-card");
    el.data = {
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    document.body.appendChild(el);

    const shadowRoot = el.shadowRoot;
    const cantoneseText = shadowRoot.querySelector(".cantonese-text");
    const romanizationText = shadowRoot.querySelector(".romanization-text");
    const translationText = shadowRoot.querySelector(".translation-text");

    expect(cantoneseText.textContent).toBe("你好");
    expect(romanizationText.textContent).toBe("nei5 hou2");
    expect(translationText.textContent).toBe("Hello");
  });

  it("should correctly return internal state via the data getter", () => {
    const testData = {
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    const el = document.createElement("example-card");
    el.data = testData;
    document.body.appendChild(el);
    expect(el.data).toEqual(testData);
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", () => {
    const el = document.createElement("example-card");
    el.data = {
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };
    document.body.appendChild(el);
    const playBtn = el.shadowRoot.getElementById("play-audio");

    playBtn.click();

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("你好");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("example-card");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("example-card");
      el.data = {
        cantonese: "你好",
        romanization: "nei5 hou2",
        translation: "Hello",
      };
      document.body.appendChild(el);
      expect(el.shadowRoot.querySelector(".cantonese-text").textContent).toBe(
        "你好",
      );
    });
  });
});
