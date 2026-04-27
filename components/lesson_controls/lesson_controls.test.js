import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonControls } from "./lesson_controls.js";

describe("LessonControls Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should not throw with empty config", () => {
      expect(() => new LessonControls()).not.toThrow();
    });
  });

  it("should be defined", () => {
    const component = new LessonControls();
    expect(component).toBeDefined();
    expect(component.element).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should dispatch events when buttons are clicked", () => {
    const component = new LessonControls();
    document.body.appendChild(component.element);
    const shadowRoot = component.shadowRoot;
    const events = ["restart", "prev", "next", "close"];

    events.forEach((id) => {
      const eventSpy = vi.fn();
      component.element.addEventListener(id, eventSpy);

      const button = shadowRoot.getElementById(id);
      button.click();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  it("should hide navigation buttons when hideNavigation is true", () => {
    const component = new LessonControls({ hideNavigation: true });
    const shadowRoot = component.shadowRoot;

    expect(shadowRoot.getElementById("restart")).toBeNull();
    expect(shadowRoot.getElementById("prev")).toBeNull();
    expect(shadowRoot.getElementById("next")).toBeNull();
    expect(shadowRoot.getElementById("close")).not.toBeNull();
  });
});
