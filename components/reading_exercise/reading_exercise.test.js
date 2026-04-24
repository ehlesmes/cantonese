import { describe, it, expect, beforeEach, vi } from "vitest";
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

  it("should display the Cantonese phrase and romanization via the data property", async () => {
    element.data = {
      cantonesePhrase: "你好",
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
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
      translationHidden: false,
    };
    element.data = testData;
    expect(element.data).toEqual(testData);
  });

  it("should hide translation by default and show it when translationHidden is false", async () => {
    element.data = { translation: "Hello" };
    const translationEl = element.shadowRoot.querySelector(".translation-text");

    // By default, it's hidden
    expect(translationEl.classList.contains("hidden")).toBe(true);

    element.data = { translationHidden: false };
    expect(translationEl.classList.contains("hidden")).toBe(false);

    element.data = { translationHidden: true };
    expect(translationEl.classList.contains("hidden")).toBe(true);
  });

  it("should dispatch 'play-audio' event when audio button is clicked", async () => {
    element.data = { cantonesePhrase: "你好" };
    const playBtn = element.shadowRoot.getElementById("play-audio");
    const eventSpy = vi.fn();

    element.addEventListener("play-audio", eventSpy);
    playBtn.click();

    expect(eventSpy).toHaveBeenCalled();
    const event = eventSpy.mock.calls[0][0];
    expect(event.detail.phrase).toBe("你好");
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", async () => {
    element.data = { cantonesePhrase: "你好" };
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

      // Clear body and re-add to trigger connectedCallback/validate
      document.body.innerHTML = "";
      element = document.createElement("reading-exercise");
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
