import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_controls.js";

describe("LessonControls Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("lesson-controls");
    document.body.appendChild(el);
    expect(customElements.get("lesson-controls")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should dispatch events when buttons are clicked", () => {
    const el = document.createElement("lesson-controls");
    document.body.appendChild(el);
    const shadowRoot = el.shadowRoot;
    const events = ["restart", "prev", "next", "close"];

    events.forEach((id) => {
      const eventSpy = vi.fn();
      el.addEventListener(id, eventSpy);

      const button = shadowRoot.getElementById(id);
      button.click();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should not log any error if data is empty (no required properties)", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const el = document.createElement("lesson-controls");
      document.body.appendChild(el);

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
