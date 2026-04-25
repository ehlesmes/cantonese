import { describe, it, expect, beforeEach, vi } from "vitest";
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

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      new LessonHeader();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });
});
