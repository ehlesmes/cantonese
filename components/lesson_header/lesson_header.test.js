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

  it("should update progress when setProgress is called", () => {
    const component = new LessonHeader({ lessonName: "test" });
    const progressBar = component.shadowRoot.querySelector(".progress-bar");

    component.setProgress(0.75);
    expect(progressBar.style.width).toBe("75%");

    component.setProgress(1);
    expect(progressBar.style.width).toBe("100%");

    component.setProgress(0);
    expect(progressBar.style.width).toBe("0%");
  });

  it("should clamp progress between 0 and 1", () => {
    const component = new LessonHeader({ lessonName: "test" });
    const progressBar = component.shadowRoot.querySelector(".progress-bar");

    component.setProgress(1.5);
    expect(progressBar.style.width).toBe("100%");

    component.setProgress(-0.5);
    expect(progressBar.style.width).toBe("0%");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      expect(() => {
        new LessonHeader({});
      }).toThrowError("Missing property: lessonName");
    });
  });
});
