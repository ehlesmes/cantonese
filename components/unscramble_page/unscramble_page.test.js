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
    element.data = { tokens };

    const exercise = element.shadowRoot.getElementById("exercise");
    const footer = element.shadowRoot.getElementById("footer");

    expect(exercise.data.tokens).toEqual(tokens);
    expect(footer.data.primaryDisabled).toBe(true);

    // Complete the exercise (order doesn't matter for enabling continue)
    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    // Page should update footer once all tokens are in slots
    expect(footer.data.primaryDisabled).toBe(false);
  });

  it("should correctly return internal state via the data getter", () => {
    const testData = {
      tokens: [
        ["你", "nei5"],
        ["好", "hou2"],
      ],
      translation: "Hello",
    };
    element.data = testData;
    expect(element.data).toEqual(testData);
  });

  it("should dispatch unscramble-result when primary button is clicked after completion", () => {
    const tokens = [["你", "nei5"]];
    element.data = { tokens };
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

  it("should enable Continue button and dispatch success: false when finished incorrectly", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    element.data = { tokens, translation: "Hello" };
    const exercise = element.shadowRoot.getElementById("exercise");
    const footer = element.shadowRoot.getElementById("footer");

    const resultSpy = vi.fn();
    element.addEventListener("unscramble-result", resultSpy);

    // Complete incorrectly (tokens are shuffled in pool, click them)
    // The test might need to find specific tokens to ensure wrong order
    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    // Original order is 你(0), 好(1).
    // Move in order: 好, 你
    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(exercise.status).toBe("wrong");
    expect(footer.data.primaryDisabled).toBe(false);
    expect(footer.data.secondaryText).toBe("Try again");

    // Click continue
    footer.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(false);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      document.body.innerHTML = "";
      element = document.createElement("unscramble-page");
      document.body.appendChild(element);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property 'tokens'"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property 'translation'"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("unscramble-page");
      el.data = { tokens: [["你", "nei5"]], translation: "you" };
      document.body.appendChild(el);
      const exercise = el.shadowRoot.getElementById("exercise");
      expect(exercise.data.tokens).toEqual([["你", "nei5"]]);
    });
  });
});
