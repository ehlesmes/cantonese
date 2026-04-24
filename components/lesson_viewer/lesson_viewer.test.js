import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_viewer.js";

describe("LessonViewer Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("lesson-viewer");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("lesson-viewer")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should propagate lesson-name to the lesson-header", () => {
    element.data = { lessonName: "Unit 1: Basics" };
    const header = element.shadowRoot.getElementById("header");
    expect(header.data.lessonName).toBe("Unit 1: Basics");
  });

  describe("Validation", () => {
    it("should log an error if lessonName is missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      element.data = { lessonName: "" };
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🚨 [LessonViewer ERROR]: Missing required data property 'lessonName'!",
        ),
      );
      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("lesson-viewer");
      el.data = { lessonName: "Greetings" };
      document.body.appendChild(el);
      const header = el.shadowRoot.getElementById("header");
      expect(header.data.lessonName).toBe("Greetings");
    });
  });
});
