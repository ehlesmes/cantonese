import { describe, it, expect, beforeEach } from "vitest";
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

  it("should display the Cantonese text, romanization, and translation", () => {
    element.setAttribute("cantonese", "你好");
    element.setAttribute("romanization", "nei5 hou2");
    element.setAttribute("translation", "Hello");

    const shadowRoot = element.shadowRoot;
    const cantoneseText = shadowRoot.querySelector(".cantonese-text");
    const romanizationText = shadowRoot.querySelector(".romanization-text");
    const translationText = shadowRoot.querySelector(".translation-text");

    expect(cantoneseText.textContent).toBe("你好");
    expect(romanizationText.textContent).toBe("nei5 hou2");
    expect(translationText.textContent).toBe("Hello");
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", () => {
    element.setAttribute("cantonese", "你好");
    const playBtn = element.shadowRoot.getElementById("play-audio");

    playBtn.click();

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("你好");
  });

  describe("Properties", () => {
    it("should update via properties and reflect to attributes", () => {
      element.cantonese = "你好";
      element.romanization = "nei5 hou2";
      element.translation = "Hello";

      expect(element.getAttribute("cantonese")).toBe("你好");
      expect(element.getAttribute("romanization")).toBe("nei5 hou2");
      expect(element.getAttribute("translation")).toBe("Hello");

      const shadow = element.shadowRoot;
      expect(shadow.querySelector(".cantonese-text").textContent).toBe("你好");
      expect(shadow.querySelector(".romanization-text").textContent).toBe(
        "nei5 hou2",
      );
      expect(shadow.querySelector(".translation-text").textContent).toBe(
        "Hello",
      );
    });
  });
});
