import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_viewer.js";

describe("LessonViewer Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("lesson-viewer");
    el.data = { lessonName: "test" };
    document.body.appendChild(el);
    expect(customElements.get("lesson-viewer")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should propagate lesson-name to the lesson-header", () => {
    const el = document.createElement("lesson-viewer");
    el.data = { lessonName: "Unit 1: Basics" };
    document.body.appendChild(el);
    const header = el.shadowRoot.getElementById("header");
    expect(header.data.lessonName).toBe("Unit 1: Basics");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("lesson-viewer");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
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
