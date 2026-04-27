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

    expect(primaryBtn.component.label).toBe("Go");
    expect(secondaryBtn.component.label).toBe("Back");
    expect(primaryBtn.component.disabled).toBe(true);
    expect(secondaryBtn.component.disabled).toBe(true);

    const enabled = new LessonFooter({
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: false,
      secondaryDisabled: false,
    });
    primaryBtn = enabled.shadowRoot.getElementById("primary-btn");
    secondaryBtn = enabled.shadowRoot.getElementById("secondary-btn");
    expect(primaryBtn.component.disabled).toBe(false);
    expect(secondaryBtn.component.disabled).toBe(false);
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
      component.primaryText = "Updated Primary";
      expect(primaryBtn.component.label).toBe("Updated Primary");
      expect(primaryBtn.classList.contains("hidden")).toBe(false);

      component.primaryText = null;
      expect(primaryBtn.classList.contains("hidden")).toBe(true);
    });

    it("should update secondary button text and visibility", () => {
      expect(secondaryBtn.classList.contains("hidden")).toBe(true);

      component.secondaryText = "Updated Secondary";
      expect(secondaryBtn.component.label).toBe("Updated Secondary");
      expect(secondaryBtn.classList.contains("hidden")).toBe(false);

      component.secondaryText = null;
      expect(secondaryBtn.classList.contains("hidden")).toBe(true);
    });

    it("should update primary button disabled state", () => {
      expect(primaryBtn.component.disabled).toBe(false);
      component.primaryDisabled = true;
      expect(primaryBtn.component.disabled).toBe(true);
      component.primaryDisabled = false;
      expect(primaryBtn.component.disabled).toBe(false);
    });

    it("should update secondary button disabled state", () => {
      expect(secondaryBtn.component.disabled).toBe(false);
      component.secondaryDisabled = true;
      expect(secondaryBtn.component.disabled).toBe(true);
      component.secondaryDisabled = false;
      expect(secondaryBtn.component.disabled).toBe(false);
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
