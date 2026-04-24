import { describe, it, expect, beforeEach } from "vitest";
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
    element.setAttribute("lesson-name", "Unit 1: Basics");
    const header = element.shadowRoot.getElementById("header");
    expect(header.getAttribute("lesson-name")).toBe("Unit 1: Basics");
  });
});
