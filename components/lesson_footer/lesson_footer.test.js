import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonFooter } from "./lesson_footer.js";

describe("LessonFooter Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new LessonFooter({ primaryText: "test" });
    expect(component).toBeDefined();
    expect(component.element).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should dispatch primary-click and secondary-click events", () => {
    const component = new LessonFooter({
      primaryText: "Primary",
      secondaryText: "Secondary",
    });
    document.body.appendChild(component.element);

    const primarySpy = vi.fn();
    const secondarySpy = vi.fn();

    component.element.addEventListener("primary-click", primarySpy);
    component.element.addEventListener("secondary-click", secondarySpy);

    component.shadowRoot.getElementById("primary-btn").click();
    component.shadowRoot.getElementById("secondary-btn").click();

    expect(primarySpy).toHaveBeenCalled();
    expect(secondarySpy).toHaveBeenCalled();
  });

  it("should update button text and disabled state based on data", () => {
    const component = new LessonFooter({
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: true,
      secondaryDisabled: true,
    });
    document.body.appendChild(component.element);

    const primaryBtn = component.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = component.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.textContent).toBe("Go");
    expect(secondaryBtn.textContent).toBe("Back");
    expect(primaryBtn.disabled).toBe(true);
    expect(secondaryBtn.disabled).toBe(true);

    component.data = {
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: false,
      secondaryDisabled: false,
    };
    expect(primaryBtn.disabled).toBe(false);
    expect(secondaryBtn.disabled).toBe(false);
  });

  it("should hide secondary button when secondaryText is missing", () => {
    const component = new LessonFooter({ primaryText: "Next" });
    const secondaryBtn = component.shadowRoot.getElementById("secondary-btn");

    expect(secondaryBtn.classList.contains("hidden")).toBe(true);

    component.data = { secondaryText: "Back" };
    expect(secondaryBtn.classList.contains("hidden")).toBe(false);

    component.data = { secondaryText: "" };
    expect(secondaryBtn.classList.contains("hidden")).toBe(true);
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new LessonFooter();
      }).toThrowError("Missing required data property");
    });
  });
});
