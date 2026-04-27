import { describe, it, expect, beforeEach } from "vitest";
import { LessonHeader } from "./lesson_header.js";

describe("LessonHeader Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new LessonHeader({ lessonName: "test" });
    expect(component).toBeDefined();
    expect(component.element).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should display the lesson name", () => {
    const component = new LessonHeader({ lessonName: "Greetings" });
    document.body.appendChild(component.element);
    const title = component.shadowRoot.getElementById("lesson-title");
    expect(title.textContent).toBe("Greetings");
  });

  it("should initialize with progress if provided", () => {
    const component = new LessonHeader({ lessonName: "test", progress: 0.5 });
    const progressBar = component.shadowRoot.querySelector(".progress-bar");
    expect(progressBar.style.width).toBe("50%");
  });

  it("should update progress when setting the progress property", () => {
    const component = new LessonHeader({ lessonName: "test" });
    const progressBar = component.shadowRoot.querySelector(".progress-bar");

    component.progress = 0.75;
    expect(progressBar.style.width).toBe("75%");

    component.progress = 1;
    expect(progressBar.style.width).toBe("100%");

    component.progress = 0;
    expect(progressBar.style.width).toBe("0%");
  });

  it("should clamp progress between 0 and 1", () => {
    const component = new LessonHeader({ lessonName: "test" });
    const progressBar = component.shadowRoot.querySelector(".progress-bar");

    component.progress = 1.5;
    expect(progressBar.style.width).toBe("100%");

    component.progress = -0.5;
    expect(progressBar.style.width).toBe("0%");
  });

  it("should hide navigation controls when hideNavigation is true", () => {
    const component = new LessonHeader({
      lessonName: "test",
      hideNavigation: true,
    });
    // The controls are in a separate component, we check if they are hidden there
    const controls = component.shadowRoot.querySelector("header").lastChild;
    // controls is the element of LessonControls
    const restartBtn = controls.shadowRoot.getElementById("restart");
    expect(restartBtn).toBeNull();
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      expect(() => {
        new LessonHeader({});
      }).toThrowError("Missing property: lessonName");
    });
  });
});
