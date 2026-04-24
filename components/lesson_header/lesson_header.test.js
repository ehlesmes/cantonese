import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_header.js";

describe("LessonHeader Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("lesson-header");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("lesson-header")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should display the lesson name", () => {
    element.data = { lessonName: "Greetings" };
    const title = element.shadowRoot.getElementById("lesson-title");
    expect(title.textContent).toBe("Greetings");
  });

  describe("Validation", () => {
    it("should log an error if lessonName is missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      element.data = { lessonName: "" };
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🚨 [LessonHeader ERROR]: Missing required data property 'lessonName'!",
        ),
      );
      errorSpy.mockRestore();
    });
  });
});
