import { describe, it, expect, beforeEach, vi } from "vitest";
import "./reading_exercise.js";

describe("ReadingExercise Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("reading-exercise");
    el.data = {
      cantonesePhrase: "test",
      romanization: "test",
      translation: "test",
    };
    document.body.appendChild(el);

    expect(customElements.get("reading-exercise")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should display the Cantonese phrase and romanization via the data property", async () => {
    const el = document.createElement("reading-exercise");
    el.data = {
      cantonesePhrase: "你好",
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
    const el = document.createElement("reading-exercise");
    const testData = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
      translationHidden: false,
    };
    el.data = testData;
    document.body.appendChild(el);
    expect(el.data).toEqual(testData);
  });

  it("should hide translation by default and show it when translationHidden is false", async () => {
    const el = document.createElement("reading-exercise");
    el.data = {
      cantonesePhrase: "test",
      romanization: "test",
      translation: "Hello",
    };
    document.body.appendChild(el);

    const translationEl = el.shadowRoot.querySelector(".translation-text");

    // By default (from data object), it's hidden
    expect(translationEl.classList.contains("hidden")).toBe(true);

    el.data = { translationHidden: false };
    expect(translationEl.classList.contains("hidden")).toBe(false);

    el.data = { translationHidden: true };
    expect(translationEl.classList.contains("hidden")).toBe(true);
  });

  it("should dispatch 'play-audio' event when audio button is clicked", async () => {
    const el = document.createElement("reading-exercise");
    el.data = {
      cantonesePhrase: "你好",
      romanization: "test",
      translation: "test",
    };
    document.body.appendChild(el);

    const playBtn = el.shadowRoot.getElementById("play-audio");
    const eventSpy = vi.fn();

    el.addEventListener("play-audio", eventSpy);
    playBtn.click();

    expect(eventSpy).toHaveBeenCalled();
    const event = eventSpy.mock.calls[0][0];
    expect(event.detail.phrase).toBe("你好");
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", async () => {
    const el = document.createElement("reading-exercise");
    el.data = {
      cantonesePhrase: "你好",
      romanization: "test",
      translation: "test",
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

      const el = document.createElement("reading-exercise");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Missing required data property 'cantonesePhrase'",
        ),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Missing required data property 'romanization'",
        ),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property 'translation'"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("reading-exercise");
      el.data = {
        cantonesePhrase: "你好",
        romanization: "nei5",
        translation: "hello",
      };
      document.body.appendChild(el);
      expect(el.shadowRoot.querySelector(".cantonese-text").textContent).toBe(
        "你好",
      );
    });
  });
});
