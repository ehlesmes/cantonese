import { describe, it, expect, beforeEach, vi } from "vitest";
import "./example_card.js";

describe("ExampleCard Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("example-card");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("example-card")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should display the Cantonese text, romanization, and translation via the data property", () => {
    element.data = {
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };

    const shadowRoot = element.shadowRoot;
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
    element.data = testData;
    expect(element.data).toEqual(testData);
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", () => {
    element.data = { cantonese: "你好" };
    const playBtn = element.shadowRoot.getElementById("play-audio");

    playBtn.click();

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("你好");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      document.body.innerHTML = "";
      element = document.createElement("example-card");
      document.body.appendChild(element);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property 'cantonese'"),
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
