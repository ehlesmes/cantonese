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
    element.data = {
      primaryText: "Primary",
      secondaryText: "Secondary",
    };

    const primarySpy = vi.fn();
    const secondarySpy = vi.fn();

    element.addEventListener("primary-click", primarySpy);
    element.addEventListener("secondary-click", secondarySpy);

    element.shadowRoot.getElementById("primary-btn").click();
    element.shadowRoot.getElementById("secondary-btn").click();

    expect(primarySpy).toHaveBeenCalled();
    expect(secondarySpy).toHaveBeenCalled();
  });

  it("should update button text and disabled state based on data", () => {
    element.data = {
      primaryText: "Go",
      secondaryText: "Back",
      primaryDisabled: true,
      secondaryDisabled: true,
    };

    const primaryBtn = element.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = element.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.textContent).toBe("Go");
    expect(secondaryBtn.textContent).toBe("Back");
    expect(primaryBtn.hasAttribute("disabled")).toBe(true);
    expect(secondaryBtn.hasAttribute("disabled")).toBe(true);

    element.data = {
      primaryDisabled: false,
      secondaryDisabled: false,
    };
    expect(primaryBtn.hasAttribute("disabled")).toBe(false);
    expect(secondaryBtn.hasAttribute("disabled")).toBe(false);
  });

  describe("Validation", () => {
    it("should log an error if primaryText is missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      element.data = { primaryText: "" };
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🚨 [LessonFooter ERROR]: Missing required data property 'primaryText'!",
        ),
      );
      errorSpy.mockRestore();
    });
  });
});
