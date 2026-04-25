import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReadingExercise } from "./reading_exercise.js";

describe("ReadingExercise Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new ReadingExercise({
      data: {
        cantonesePhrase: "test",
        romanization: "test",
        translation: "test",
      },
    });
    expect(component).toBeInstanceOf(ReadingExercise);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should display the Cantonese phrase and romanization via the data property", () => {
    const component = new ReadingExercise({
      data: {
        cantonesePhrase: "你好",
        romanization: "nei5 hou2",
        translation: "Hello",
      },
    });

    const shadowRoot = component.shadowRoot;
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
    const component = new ReadingExercise({ data: testData });
    expect(component.data).toEqual(testData);
  });

  it("should hide translation by default and show it when translationHidden is false", () => {
    const component = new ReadingExercise({
      data: {
        cantonesePhrase: "test",
        romanization: "test",
        translation: "Hello",
      },
    });

    const translationEl =
      component.shadowRoot.querySelector(".translation-text");

    // By default (from data object), it's hidden
    expect(translationEl.classList.contains("hidden")).toBe(true);

    component.data = { translationHidden: false };
    expect(translationEl.classList.contains("hidden")).toBe(false);

    component.data = { translationHidden: true };
    expect(translationEl.classList.contains("hidden")).toBe(true);
  });

  it("should dispatch 'play-audio' event when audio button is clicked", () => {
    const component = new ReadingExercise({
      data: {
        cantonesePhrase: "你好",
        romanization: "test",
        translation: "test",
      },
    });
    document.body.appendChild(component.element);

    const playBtn = component.shadowRoot.getElementById("play-audio");
    const eventSpy = vi.fn();

    component.element.addEventListener("play-audio", eventSpy);
    playBtn.click();

    expect(eventSpy).toHaveBeenCalled();
    const event = eventSpy.mock.calls[0][0];
    expect(event.detail.phrase).toBe("你好");
  });

  it("should call window.speechSynthesis.speak when audio button is clicked", () => {
    const component = new ReadingExercise({
      data: {
        cantonesePhrase: "你好",
        romanization: "test",
        translation: "test",
      },
    });

    const playBtn = component.shadowRoot.getElementById("play-audio");
    playBtn.click();

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("你好");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      new ReadingExercise({ data: {} });

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
});
