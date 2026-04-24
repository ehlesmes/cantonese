import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_header.js";

describe("LessonHeader Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("lesson-header");
    el.data = { lessonName: "test" };
    document.body.appendChild(el);
    expect(customElements.get("lesson-header")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should display the lesson name", () => {
    const el = document.createElement("lesson-header");
    el.data = { lessonName: "Greetings" };
    document.body.appendChild(el);
    const title = el.shadowRoot.getElementById("lesson-title");
    expect(title.textContent).toBe("Greetings");
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("lesson-header");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("lesson-header");
      el.data = { lessonName: "Greetings" };
      document.body.appendChild(el);
      expect(el.shadowRoot.getElementById("lesson-title").textContent).toBe(
        "Greetings",
      );
    });
  });
});
