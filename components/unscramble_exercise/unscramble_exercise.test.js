import { describe, it, expect, beforeEach, vi } from "vitest";
import "./unscramble_exercise.js";

describe("UnscrambleExercise Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("unscramble-exercise");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("unscramble-exercise")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should initialize tokens and populate the pool", () => {
    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    element.setAttribute("tokens", JSON.stringify(tokens));

    const poolTokens = element.shadowRoot.querySelectorAll("#pool .token-text");
    expect(poolTokens.length).toBe(2);

    const texts = Array.from(poolTokens).map((el) => el.textContent);
    expect(texts).toContain("你");
    expect(texts).toContain("好");
  });

  it("should move tokens to slots when clicked and dispatch 'complete' when pool is empty", () => {
    const tokens = [["你", "nei5"]];
    element.setAttribute("tokens", JSON.stringify(tokens));

    const poolToken = element.shadowRoot.querySelector("#pool ui-tooltip");
    const completeSpy = vi.fn();
    element.addEventListener("complete", completeSpy);

    poolToken.click();

    const slotTokens =
      element.shadowRoot.querySelectorAll("#slots .token-text");
    expect(slotTokens.length).toBe(1);
    expect(slotTokens[0].textContent).toBe("你");
    expect(
      element.shadowRoot.querySelectorAll("#pool .token-text").length,
    ).toBe(0);
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should set status to 'right' when tokens are moved in correct order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    element.setAttribute("tokens", JSON.stringify(tokens));

    const getPoolToken = (text) =>
      Array.from(element.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    expect(element.getAttribute("status")).toBe("right");
  });

  it("should set status to 'wrong' when tokens are moved in incorrect order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    element.setAttribute("tokens", JSON.stringify(tokens));

    const getPoolToken = (text) =>
      Array.from(element.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(element.getAttribute("status")).toBe("wrong");
  });

  it("should move only the specifically clicked slot token back to the pool", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const tokens = [
      ["A", "a"],
      ["B", "b"],
      ["C", "c"],
    ];
    element.setAttribute("tokens", JSON.stringify(tokens));

    const getPoolToken = (text) =>
      Array.from(element.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    const getSlotToken = (text) =>
      Array.from(element.shadowRoot.querySelectorAll("#slots ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    // Move in WRONG order (B, A, C) so it's not solved and tokens stay interactive
    getPoolToken("B").click();
    getPoolToken("A").click();
    getPoolToken("C").click();

    expect(element.getAttribute("status")).toBe("wrong");
    expect(
      element.shadowRoot.querySelectorAll("#slots ui-tooltip").length,
    ).toBe(3);

    // Click "A" in slots to move it back to pool
    const tokenA = getSlotToken("A");
    tokenA.click();

    const slotTexts = Array.from(
      element.shadowRoot.querySelectorAll("#slots .token-text"),
    ).map((el) => el.textContent);

    const poolTexts = Array.from(
      element.shadowRoot.querySelectorAll("#pool .token-text"),
    ).map((el) => el.textContent);

    expect(slotTexts).toEqual(["B", "C"]);
    expect(poolTexts).toContain("A");
    expect(poolTexts.length).toBe(1);
  });

  it("should maintain the order in which tokens are clicked", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const tokens = [
      ["A", "a"],
      ["B", "b"],
      ["C", "c"],
    ];
    element.setAttribute("tokens", JSON.stringify(tokens));

    const getPoolToken = (text) =>
      Array.from(element.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("B").click();
    getPoolToken("C").click();
    getPoolToken("A").click();

    const slotTexts = Array.from(
      element.shadowRoot.querySelectorAll("#slots .token-text"),
    ).map((el) => el.textContent);

    expect(slotTexts).toEqual(["B", "C", "A"]);
  });

  describe("Properties", () => {
    it("should update via tokens property and reflect to attribute", () => {
      const tokens = [["你好", "nei5 hou2"]];
      element.tokens = tokens;

      expect(element.getAttribute("tokens")).toBe(JSON.stringify(tokens));
      expect(element.shadowRoot.getElementById("pool").children.length).toBe(1);
    });

    it("should update translation via property", () => {
      element.translation = "Hello";
      expect(element.getAttribute("translation")).toBe("Hello");
      expect(
        element.shadowRoot.querySelector(".translation-text").textContent,
      ).toBe("Hello");
    });

    it("should not reset state if same tokens are set via property", () => {
      const tokens = [
        ["A", "a"],
        ["B", "b"],
      ];
      element.tokens = tokens;

      // Move one to slots
      const poolToken = element.shadowRoot.querySelector("#pool ui-tooltip");
      poolToken.click();

      const initialSlots =
        element.shadowRoot.querySelectorAll("#slots ui-tooltip").length;
      expect(initialSlots).toBe(1);

      // Set same tokens again
      element.tokens = tokens;
      expect(
        element.shadowRoot.querySelectorAll("#slots ui-tooltip").length,
      ).toBe(1);
    });
  });
});
