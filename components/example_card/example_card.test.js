import { describe, it, expect, beforeEach } from "vitest";
import { ExampleCard } from "./example_card.js";

describe("ExampleCard Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new ExampleCard({
      cantonese: "test",
      romanization: "test",
      translation: "test",
    });
    expect(component).toBeDefined();
    expect(component.element).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should display the Cantonese text, romanization, and translation via the data property", () => {
    const component = new ExampleCard({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });
    document.body.appendChild(component.element);

    const tooltip = component.shadowRoot.querySelector("#tooltip");
    const cantoneseText = tooltip.shadowRoot.querySelector(".cantonese-text");
    const romanizationText =
      tooltip.shadowRoot.querySelector(".romanization-text");
    const translationText =
      component.shadowRoot.querySelector(".translation-text");

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
    const component = new ExampleCard(testData);
    expect(component.data).toEqual(testData);
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", () => {
    const component = new ExampleCard({
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    });
    document.body.appendChild(component.element);
    const playBtn = component.shadowRoot.getElementById("play-audio");

    playBtn.click();

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("你好");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      expect(() => {
        new ExampleCard({});
      }).toThrowError("Missing required data property");
    });
  });
});
