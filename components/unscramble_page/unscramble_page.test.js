import { describe, it, expect, beforeEach, vi } from "vitest";
import "./unscramble_page.js";

describe("UnscramblePage Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("unscramble-page");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("unscramble-page")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should propagate tokens to the unscramble-exercise and enable footer on complete", () => {
    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    element.tokens = tokens;

    const exercise = element.shadowRoot.getElementById("exercise");
    const footer = element.shadowRoot.getElementById("footer");

    expect(exercise.tokens).toEqual(tokens);
    expect(footer.primaryDisabled).toBe(true);

    // Complete the exercise correctly
    exercise.moveToSlots(0);
    exercise.moveToSlots(0);

    // Page should update footer
    expect(footer.primaryDisabled).toBe(false);
  });

  it("should dispatch unscramble-result when primary button is clicked after completion", () => {
    const tokens = [["你", "nei5"]];
    element.tokens = tokens;
    const exercise = element.shadowRoot.getElementById("exercise");
    const footer = element.shadowRoot.getElementById("footer");

    const resultSpy = vi.fn();
    element.addEventListener("unscramble-result", resultSpy);

    // Complete correctly
    exercise.moveToSlots(0);

    // Click continue
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);
  });

  describe("Validation", () => {
    it("should log error if required properties are missing", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      document.body.innerHTML = "";
      element = document.createElement("unscramble-page");
      document.body.appendChild(element);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required property 'tokens'"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required property 'translation'"),
      );

      consoleSpy.mockRestore();
    });
  });
});
