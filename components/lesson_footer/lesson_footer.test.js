import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_footer.js";

describe("LessonFooter Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("lesson-footer");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("lesson-footer")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should dispatch primary-click and secondary-click events", () => {
    element.setAttribute("primary-text", "Primary");
    element.setAttribute("secondary-text", "Secondary");

    const primarySpy = vi.fn();
    const secondarySpy = vi.fn();

    element.addEventListener("primary-click", primarySpy);
    element.addEventListener("secondary-click", secondarySpy);

    element.shadowRoot.getElementById("primary-btn").click();
    element.shadowRoot.getElementById("secondary-btn").click();

    expect(primarySpy).toHaveBeenCalled();
    expect(secondarySpy).toHaveBeenCalled();
  });

  it("should update button text and disabled state based on attributes", () => {
    element.setAttribute("primary-text", "Go");
    element.setAttribute("secondary-text", "Back");
    element.setAttribute("primary-disabled", "true");
    element.setAttribute("secondary-disabled", "true");

    const primaryBtn = element.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = element.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.textContent).toBe("Go");
    expect(secondaryBtn.textContent).toBe("Back");
    expect(primaryBtn.hasAttribute("disabled")).toBe(true);
    expect(secondaryBtn.hasAttribute("disabled")).toBe(true);

    element.setAttribute("primary-disabled", "false");
    element.setAttribute("secondary-disabled", "false");
    expect(primaryBtn.hasAttribute("disabled")).toBe(false);
    expect(secondaryBtn.hasAttribute("disabled")).toBe(false);
  });
});
