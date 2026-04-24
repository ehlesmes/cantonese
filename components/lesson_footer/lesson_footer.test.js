import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_footer.js";

describe("LessonFooter Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("lesson-footer");
    el.data = { primaryText: "test" };
    document.body.appendChild(el);
    expect(customElements.get("lesson-footer")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should dispatch primary-click and secondary-click events", () => {
    const el = document.createElement("lesson-footer");
    el.data = {
      primaryText: "Primary",
      secondaryText: "Secondary",
    };
    document.body.appendChild(el);

    const primarySpy = vi.fn();
    const secondarySpy = vi.fn();

    el.addEventListener("primary-click", primarySpy);
    el.addEventListener("secondary-click", secondarySpy);

    el.shadowRoot.getElementById("primary-btn").click();
    el.shadowRoot.getElementById("secondary-btn").click();

    expect(primarySpy).toHaveBeenCalled();
    expect(secondarySpy).toHaveBeenCalled();
  });

  it("should update button text and disabled state based on data", () => {
    const el = document.createElement("lesson-footer");
    el.data = {
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: true,
      secondaryDisabled: true,
    };
    document.body.appendChild(el);

    const primaryBtn = el.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = el.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.textContent).toBe("Go");
    expect(secondaryBtn.textContent).toBe("Back");
    expect(primaryBtn.hasAttribute("disabled")).toBe(true);
    expect(secondaryBtn.hasAttribute("disabled")).toBe(true);

    el.data = {
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: false,
      secondaryDisabled: false,
    };
    expect(primaryBtn.hasAttribute("disabled")).toBe(false);
    expect(secondaryBtn.hasAttribute("disabled")).toBe(false);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("lesson-footer");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("lesson-footer");
      const testData = { primaryText: "Late Upgrade" };

      // Set property before connecting to DOM
      el.data = testData;

      document.body.appendChild(el);

      expect(el.data.primaryText).toBe("Late Upgrade");
      expect(el.shadowRoot.getElementById("primary-btn").textContent).toBe(
        "Late Upgrade",
      );
    });
  });
});
