import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonControls } from "./lesson_controls.js";

describe("LessonControls Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
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
});
