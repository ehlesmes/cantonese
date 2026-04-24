import { describe, it, expect, beforeEach, vi } from "vitest";
import "./unscramble_exercise.js";

describe("UnscrambleExercise Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens: [["test", "test"]], translation: "test" };
    document.body.appendChild(el);
    expect(customElements.get("unscramble-exercise")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should initialize tokens and populate the pool via the data property", () => {
    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "Hello" };
    document.body.appendChild(el);

    const poolTokens = el.shadowRoot.querySelectorAll("#pool .token-text");
    expect(poolTokens.length).toBe(2);

    const texts = Array.from(poolTokens).map((el) => el.textContent);
    expect(texts).toContain("你");
    expect(texts).toContain("好");
  });

  it("should correctly return internal state via the data getter", () => {
    const testData = {
      tokens: [
        ["你", "nei5"],
        ["好", "hou2"],
      ],
      translation: "Hello",
    };
    const el = document.createElement("unscramble-exercise");
    el.data = testData;
    document.body.appendChild(el);
    expect(el.data).toEqual(testData);
  });

  it("should move tokens to slots when clicked and dispatch 'complete' when pool is empty", () => {
    const tokens = [["你", "nei5"]];
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "Hello" };
    document.body.appendChild(el);

    const poolToken = el.shadowRoot.querySelector("#pool ui-tooltip");
    const completeSpy = vi.fn();
    el.addEventListener("complete", completeSpy);

    poolToken.click();

    const slotTokens = el.shadowRoot.querySelectorAll("#slots .token-text");
    expect(slotTokens.length).toBe(1);
    expect(slotTokens[0].textContent).toBe("你");
    expect(el.shadowRoot.querySelectorAll("#pool .token-text").length).toBe(0);
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should set status to 'right' when tokens are moved in correct order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "Hello" };
    document.body.appendChild(el);

    const getPoolToken = (text) =>
      Array.from(el.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    expect(el.status).toBe("right");
    expect(el.getAttribute("status")).toBe("right");
  });

  it("should set status to 'wrong' when tokens are moved in incorrect order and reflect to attribute", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "Hello" };
    document.body.appendChild(el);

    const getPoolToken = (text) =>
      Array.from(el.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(el.status).toBe("wrong");
    expect(el.getAttribute("status")).toBe("wrong");
  });

  it("should move only the specifically clicked slot token back to the pool", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const tokens = [
      ["A", "a"],
      ["B", "b"],
      ["C", "c"],
    ];
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "ABC" };
    document.body.appendChild(el);

    const getPoolToken = (text) =>
      Array.from(el.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    const getSlotToken = (text) =>
      Array.from(el.shadowRoot.querySelectorAll("#slots ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    // Move in WRONG order (B, A, C) so it's not solved and tokens stay interactive
    getPoolToken("B").click();
    getPoolToken("A").click();
    getPoolToken("C").click();

    expect(el.status).toBe("wrong");
    expect(el.shadowRoot.querySelectorAll("#slots ui-tooltip").length).toBe(3);

    // Click "A" in slots to move it back to pool
    const tokenA = getSlotToken("A");
    tokenA.click();

    const slotTexts = Array.from(
      el.shadowRoot.querySelectorAll("#slots .token-text"),
    ).map((el) => el.textContent);

    const poolTexts = Array.from(
      el.shadowRoot.querySelectorAll("#pool .token-text"),
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
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "ABC" };
    document.body.appendChild(el);

    const getPoolToken = (text) =>
      Array.from(el.shadowRoot.querySelectorAll("#pool ui-tooltip")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("B").click();
    getPoolToken("C").click();
    getPoolToken("A").click();

    const slotTexts = Array.from(
      el.shadowRoot.querySelectorAll("#slots .token-text"),
    ).map((el) => el.textContent);

    expect(slotTexts).toEqual(["B", "C", "A"]);
  });

  it("should not reset state if same tokens are set via property", () => {
    const tokens = [
      ["A", "a"],
      ["B", "b"],
    ];
    const el = document.createElement("unscramble-exercise");
    el.data = { tokens, translation: "AB" };
    document.body.appendChild(el);

    // Move one to slots
    const poolToken = el.shadowRoot.querySelector("#pool ui-tooltip");
    poolToken.click();

    const initialSlots =
      el.shadowRoot.querySelectorAll("#slots ui-tooltip").length;
    expect(initialSlots).toBe(1);

    // Set same tokens again
    el.data = { tokens, translation: "AB" };
    expect(el.shadowRoot.querySelectorAll("#slots ui-tooltip").length).toBe(1);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("unscramble-exercise");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("unscramble-exercise");
      el.data = { tokens: [["你", "nei5"]], translation: "you" };
      document.body.appendChild(el);
      expect(el.shadowRoot.querySelector(".token-text").textContent).toBe("你");
    });
  });
});
