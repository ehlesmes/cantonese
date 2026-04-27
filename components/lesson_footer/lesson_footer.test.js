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
    const disabled = new LessonFooter({
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: true,
      secondaryDisabled: true,
    });

    let primaryBtn = disabled.shadowRoot.getElementById("primary-btn");
    let secondaryBtn = disabled.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.label).toBe("Go");
    expect(secondaryBtn.label).toBe("Back");
    expect(primaryBtn.disabled).toBe(true);
    expect(secondaryBtn.disabled).toBe(true);

    const enabled = new LessonFooter({
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: false,
      secondaryDisabled: false,
    });
    primaryBtn = enabled.shadowRoot.getElementById("primary-btn");
    secondaryBtn = enabled.shadowRoot.getElementById("secondary-btn");
    expect(primaryBtn.disabled).toBe(false);
    expect(secondaryBtn.disabled).toBe(false);
  });

  it("should hide secondary button when secondaryText is missing", () => {
    const component = new LessonFooter({ primaryText: "Next" });
    let secondaryBtn = component.shadowRoot.getElementById("secondary-btn");

    expect(secondaryBtn.classList.contains("hidden")).toBe(true);

    const secondary = new LessonFooter({
      primaryText: "Next",
      secondaryText: "Back",
    });
    secondaryBtn = secondary.shadowRoot.getElementById("secondary-btn");
    expect(secondaryBtn.classList.contains("hidden")).toBe(false);
  });

  describe("Dynamic Updates", () => {
    let component;
    let primaryBtn;
    let secondaryBtn;

    beforeEach(() => {
      component = new LessonFooter({ primaryText: "Initial Primary" });
      primaryBtn = component.shadowRoot.getElementById("primary-btn");
      secondaryBtn = component.shadowRoot.getElementById("secondary-btn");
    });

    it("should update primary button text and visibility", () => {
      component.setPrimary("Updated Primary");
      expect(primaryBtn.label).toBe("Updated Primary");
      expect(primaryBtn.classList.contains("hidden")).toBe(false);

      component.setPrimary(null);
      expect(primaryBtn.classList.contains("hidden")).toBe(true);
    });

    it("should update secondary button text and visibility", () => {
      expect(secondaryBtn.classList.contains("hidden")).toBe(true);

      component.setSecondary("Updated Secondary");
      expect(secondaryBtn.label).toBe("Updated Secondary");
      expect(secondaryBtn.classList.contains("hidden")).toBe(false);

      component.setSecondary(null);
      expect(secondaryBtn.classList.contains("hidden")).toBe(true);
    });

    it("should update primary button disabled state", () => {
      expect(primaryBtn.disabled).toBe(false);
      component.setPrimaryDisabled(true);
      expect(primaryBtn.disabled).toBe(true);
      component.setPrimaryDisabled(false);
      expect(primaryBtn.disabled).toBe(false);
    });

    it("should update secondary button disabled state", () => {
      expect(secondaryBtn.disabled).toBe(false);
      component.setSecondaryDisabled(true);
      expect(secondaryBtn.disabled).toBe(true);
      component.setSecondaryDisabled(false);
      expect(secondaryBtn.disabled).toBe(false);
    });
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      expect(() => {
        new LessonFooter();
      }).toThrowError("data is undefined");
    });
  });
});
