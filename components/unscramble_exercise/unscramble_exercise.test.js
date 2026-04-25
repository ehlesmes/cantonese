import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnscrambleExercise } from "./unscramble_exercise.js";

describe("UnscrambleExercise Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new UnscrambleExercise({
      tokens: [["test", "test"]],
      translation: "test",
    });
    document.body.appendChild(component.element);
    expect(component).toBeInstanceOf(UnscrambleExercise);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should initialize tokens and populate the pool via the data property", () => {
    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const component = new UnscrambleExercise({ tokens, translation: "Hello" });
    document.body.appendChild(component.element);

    const poolTokens = component.shadowRoot.querySelector("#pool").children;
    expect(poolTokens.length).toBe(2);

    const texts = Array.from(poolTokens).map(
      (el) => el.shadowRoot.querySelector(".token-text").textContent,
    );
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
    const component = new UnscrambleExercise(testData);
    document.body.appendChild(component.element);
    expect(component.data).toEqual(testData);
  });

  it("should move tokens to slots when clicked and dispatch 'complete' when pool is empty", () => {
    const tokens = [["你", "nei5"]];
    const component = new UnscrambleExercise({ tokens, translation: "Hello" });
    document.body.appendChild(component.element);

    // Tokens are now just Tooltip elements (their elements)
    const poolToken = component.shadowRoot.querySelector("#pool > *");
    const completeSpy = vi.fn();
    component.element.addEventListener("complete", completeSpy);

    poolToken.click();

    const slotChildren = Array.from(
      component.shadowRoot.querySelector("#slots"),
    );
    const slotTokens = slotChildren.map((el) =>
      el.shadowRoot.querySelector(".token-text"),
    );
    console.info(component.shadowRoot.innerHTML);
    expect(slotTokens.length).toBe(1);
    expect(slotTokens[0].textContent).toBe("你");
    expect(
      component.shadowRoot.querySelectorAll("#pool .token-text").length,
    ).toBe(0);
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should set status to 'right' when tokens are moved in correct order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const component = new UnscrambleExercise({ tokens, translation: "Hello" });
    document.body.appendChild(component.element);

    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    expect(component.status).toBe("right");
    expect(component.element.getAttribute("status")).toBe("right");
  });

  it("should set status to 'wrong' when tokens are moved in incorrect order and reflect to attribute", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const tokens = [
      ["你", "nei5"],
      ["好", "hou2"],
    ];
    const component = new UnscrambleExercise({ tokens, translation: "Hello" });
    document.body.appendChild(component.element);

    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(component.status).toBe("wrong");
    expect(component.element.getAttribute("status")).toBe("wrong");
  });

  it("should move only the specifically clicked slot token back to the pool", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const tokens = [
      ["A", "a"],
      ["B", "b"],
      ["C", "c"],
    ];
    const component = new UnscrambleExercise({ tokens, translation: "ABC" });
    document.body.appendChild(component.element);

    const getPoolToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    const getSlotToken = (text) =>
      Array.from(component.shadowRoot.querySelectorAll("#slots > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    // Move in WRONG order (B, A, C) so it's not solved and tokens stay interactive
    getPoolToken("B").click();
    getPoolToken("A").click();
    getPoolToken("C").click();

    expect(component.status).toBe("wrong");
    expect(component.shadowRoot.querySelectorAll("#slots > *").length).toBe(3);

    // Click "A" in slots to move it back to pool
    const tokenA = getSlotToken("A");
    tokenA.click();

    const slotTexts = Array.from(
      component.shadowRoot.querySelectorAll("#slots .token-text"),
    ).map((el) => el.textContent);

    const poolTexts = Array.from(
      component.shadowRoot.querySelectorAll("#pool .token-text"),
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
    const component = new UnscrambleExercise({ tokens, translation: "ABC" });
    document.body.appendChild(component.element);

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

  it("should not reset state if same tokens are set via property", () => {
    const tokens = [
      ["A", "a"],
      ["B", "b"],
    ];
    const component = new UnscrambleExercise({ tokens, translation: "AB" });
    document.body.appendChild(component.element);

    // Move one to slots
    const poolToken = component.shadowRoot.querySelector("#pool > *");
    poolToken.click();

    const initialSlots =
      component.shadowRoot.querySelectorAll("#slots > *").length;
    expect(initialSlots).toBe(1);

    // Set same tokens again
    component.data = { tokens, translation: "AB" };
    expect(component.shadowRoot.querySelectorAll("#slots > *").length).toBe(1);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      new UnscrambleExercise();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });
});
