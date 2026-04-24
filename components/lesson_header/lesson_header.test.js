import { describe, it, expect, beforeEach } from "vitest";
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
    element.setAttribute("lesson-name", "Greetings");
    const title = element.shadowRoot.getElementById("lesson-title");
    expect(title.textContent).toBe("Greetings");
  });
});
