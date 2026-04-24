import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnscramblePage } from "./unscramble_page.js";

describe("UnscramblePage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const page = new UnscramblePage();
    page.data = { tokens: [["test", "test"]], translation: "test" };
    document.body.appendChild(page.element);
    expect(page).toBeInstanceOf(UnscramblePage);
    expect(page.shadowRoot).not.toBeNull();
  });

  it("should propagate tokens to the unscramble-exercise and enable footer on complete", () => {
    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const page = new UnscramblePage();
    page.data = { tokens, translation: "Hello" };
    document.body.appendChild(page.element);

    const exercise = page._exercise;
    const footer = page._footer;

    expect(exercise.data.tokens).toEqual(tokens);
    expect(footer.data.primaryDisabled).toBe(true);

    // Complete the exercise
    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool .token-text"))
        .find((el) => el.textContent === text)
        .closest("#pool > *");

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
    const page = new UnscramblePage();
    page.data = testData;
    document.body.appendChild(page.element);
    expect(page.data).toEqual(testData);
  });

  it("should dispatch unscramble-result when primary button is clicked after completion", () => {
    const tokens = [["你", "nei5"]];
    const page = new UnscramblePage();
    page.data = { tokens, translation: "you" };
    document.body.appendChild(page.element);
    const exercise = page._exercise;
    const footer = page._footer;

    const resultSpy = vi.fn();
    page.element.addEventListener("unscramble-result", resultSpy);

    // Complete correctly
    exercise.moveToSlots(0);

    // Click continue
    footer.element.dispatchEvent(
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
    const page = new UnscramblePage();
    page.data = { tokens, translation: "Hello" };
    document.body.appendChild(page.element);
    const exercise = page._exercise;
    const footer = page._footer;

    const resultSpy = vi.fn();
    page.element.addEventListener("unscramble-result", resultSpy);

    // Complete incorrectly (tokens are shuffled in pool, click them)
    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool .token-text"))
        .find((el) => el.textContent === text)
        .closest("#pool > *");

    // Original order is 你(0), 好(1).
    // Move in order: 好, 你
    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(exercise.status).toBe("wrong");
    expect(footer.data.primaryDisabled).toBe(false);
    expect(footer.data.secondaryText).toBe("Try again");

    // Click continue
    footer.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(false);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      new UnscramblePage();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });
});
