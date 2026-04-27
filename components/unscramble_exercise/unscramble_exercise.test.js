import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnscrambleExercise } from "./unscramble_exercise.js";

describe("UnscrambleExercise Component", () => {
  const testData = {
    tokens: [
      ["你", "nei5"],
      ["好", "hou2"],
    ],
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.replaceChildren();
    vi.spyOn(Math, "random").mockReturnValue(0.1); // Ensure deterministic shuffle
  });

  it("should be defined", () => {
    const component = new UnscrambleExercise(testData);
    expect(component).toBeInstanceOf(UnscrambleExercise);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should initialize tokens and populate the pool", () => {
    const component = new UnscrambleExercise(testData);
    const poolTokens =
      component.shadowRoot.querySelectorAll("#pool .token-text");
    expect(poolTokens.length).toBe(2);

    const texts = Array.from(poolTokens).map((el) => el.textContent);
    expect(texts).toContain("你");
    expect(texts).toContain("好");
  });

  it("should move tokens to slots when clicked and dispatch 'complete' when pool is empty", () => {
    const singleTokenData = {
      tokens: [["你", "nei5"]],
      translation: "Hello",
    };
    const component = new UnscrambleExercise(singleTokenData);
    const poolToken = component.shadowRoot.querySelector("#pool > *");
    const completeSpy = vi.fn();
    component.element.addEventListener("complete", completeSpy);

    poolToken.click();

    const slotTokens =
      component.shadowRoot.querySelectorAll("#slots .token-text");
    expect(slotTokens.length).toBe(1);
    expect(slotTokens[0].textContent).toBe("你");
    expect(
      component.shadowRoot.querySelectorAll("#pool .token-text").length,
    ).toBe(0);
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should maintain the order in which tokens are clicked", () => {
    const component = new UnscrambleExercise({
      tokens: [
        ["A", "a"],
        ["B", "b"],
        ["C", "c"],
      ],
      translation: "ABC",
    });

    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("B").click();
    getPoolToken("C").click();
    getPoolToken("A").click();

    const slotTexts = Array.from(
      component.shadowRoot.querySelectorAll("#slots .token-text"),
    ).map((el) => el.textContent);

    expect(slotTexts).toEqual(["B", "C", "A"]);
  });

  it("should set status to 'right' when tokens are moved in correct order", () => {
    const component = new UnscrambleExercise(testData);

    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    expect(component.status).toBe("right");
    expect(component.element.getAttribute("status")).toBe("right");
  });

  it("should set status to 'wrong' when tokens are moved in incorrect order", () => {
    const component = new UnscrambleExercise(testData);

    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(component.status).toBe("wrong");
    expect(component.element.getAttribute("status")).toBe("wrong");
  });

  it("should move tokens back to pool when clicked in slots", () => {
    const component = new UnscrambleExercise(testData);
    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    expect(component.shadowRoot.querySelectorAll("#slots > *").length).toBe(1);

    const slotToken = component.shadowRoot.querySelector("#slots > *");
    slotToken.click();
    expect(component.shadowRoot.querySelectorAll("#slots > *").length).toBe(0);
    expect(component.shadowRoot.querySelectorAll("#pool > *").length).toBe(2);
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new UnscrambleExercise({});
      }).toThrow();
    });
  });
});
