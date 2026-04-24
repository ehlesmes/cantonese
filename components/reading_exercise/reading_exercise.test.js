import { describe, it, expect, beforeEach } from "vitest";
import "./reading_exercise.js";

describe("ReadingExercise Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("reading-exercise");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("reading-exercise")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should display the Cantonese phrase and romanization", async () => {
    element.setAttribute("cantonese-phrase", "你好");
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

  it("should hide translation by default and show it when translation-hidden is false", async () => {
    element.setAttribute("translation", "Hello");
    const translationEl = element.shadowRoot.querySelector(".translation-text");

    // By default, it's hidden (connectedCallback sets translation-hidden="true" if not present)
    expect(translationEl.classList.contains("hidden")).toBe(true);

    element.setAttribute("translation-hidden", "false");
    expect(translationEl.classList.contains("hidden")).toBe(false);

    element.setAttribute("translation-hidden", "true");
    expect(translationEl.classList.contains("hidden")).toBe(true);
  });

  it("should dispatch 'play-audio' event when audio button is clicked", async () => {
    element.setAttribute("cantonese-phrase", "你好");
    const playBtn = element.shadowRoot.getElementById("play-audio");
    const eventSpy = vi.fn();

    element.addEventListener("play-audio", eventSpy);
    playBtn.click();

    expect(eventSpy).toHaveBeenCalled();
    const event = eventSpy.mock.calls[0][0];
    expect(event.detail.phrase).toBe("你好");
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", async () => {
    element.setAttribute("cantonese-phrase", "你好");
    const playBtn = element.shadowRoot.getElementById("play-audio");

    playBtn.click();

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("你好");
  });

  describe("Properties", () => {
    it("should update via properties and reflect to attributes", () => {
      element.cantonesePhrase = "你好";
      element.romanization = "nei5 hou2";
      element.translation = "Hello";
      element.translationHidden = false;

      expect(element.getAttribute("cantonese-phrase")).toBe("你好");
      expect(element.getAttribute("romanization")).toBe("nei5 hou2");
      expect(element.getAttribute("translation")).toBe("Hello");
      expect(element.getAttribute("translation-hidden")).toBe("false");

      const shadow = element.shadowRoot;
      expect(shadow.querySelector(".cantonese-text").textContent).toBe("你好");
      expect(shadow.querySelector(".romanization-text").textContent).toBe(
        "nei5 hou2",
      );
      expect(shadow.querySelector(".translation-text").textContent).toBe(
        "Hello",
      );
      expect(
        shadow.querySelector(".translation-text").classList.contains("hidden"),
      ).toBe(false);
    });

    it("should handle translationHidden property correctly", () => {
      element.translationHidden = true;
      expect(element.getAttribute("translation-hidden")).toBe("true");
      expect(
        element.shadowRoot
          .querySelector(".translation-text")
          .classList.contains("hidden"),
      ).toBe(true);

      element.translationHidden = false;
      expect(element.getAttribute("translation-hidden")).toBe("false");
      expect(
        element.shadowRoot
          .querySelector(".translation-text")
          .classList.contains("hidden"),
      ).toBe(false);
    });
  });
});
