import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_controls.js";

describe("LessonControls Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("lesson-controls");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("lesson-controls")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should dispatch events when buttons are clicked", () => {
    const shadowRoot = element.shadowRoot;
    const events = ["restart", "prev", "next", "close"];

    events.forEach((id) => {
      const eventSpy = vi.fn();
      element.addEventListener(id, eventSpy);

      const button = shadowRoot.getElementById(id);
      button.click();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should not log any error if data is empty (no required properties)", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      element.data = {};
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
