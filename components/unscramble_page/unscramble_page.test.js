import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnscramblePage } from "./unscramble_page.js";

describe("UnscramblePage Component", () => {
  const testData = {
    tokens: [
      ["你", "nei5"],
      ["好", "hou2"],
    ],
    translation: "Hello",
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  it("should be defined", () => {
    const component = new UnscramblePage(testData);
    expect(component).toBeInstanceOf(UnscramblePage);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should enable continue button when exercise is complete", () => {
    const component = new UnscramblePage(testData);
    const footer = component.querySelector("#footer");
    const primaryBtn = footer.shadowRoot.getElementById("primary-btn");
    const exercise = component._exercise;

    expect(primaryBtn.disabled).toBe(true);

    // Complete the exercise correctly
    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    expect(primaryBtn.disabled).toBe(false);
    expect(exercise.status).toBe("right");
  });

  it("should show 'Try again' when exercise is complete but wrong", () => {
    const component = new UnscramblePage(testData);
    const footer = component.querySelector("#footer");
    const secondaryBtn = footer.shadowRoot.getElementById("secondary-btn");
    const exercise = component._exercise;

    expect(secondaryBtn.classList.contains("hidden")).toBe(true);

    // Complete the exercise incorrectly
    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(secondaryBtn.classList.contains("hidden")).toBe(false);
    expect(secondaryBtn.textContent).toBe("Try again");
    expect(exercise.status).toBe("wrong");
  });

  it("should reset exercise when 'Try again' is clicked", () => {
    const component = new UnscramblePage(testData);
    const footer = component.querySelector("#footer");
    const secondaryBtn = footer.shadowRoot.getElementById("secondary-btn");
    const exercise = component._exercise;

    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("好").click();
    getPoolToken("你").click();

    expect(exercise.status).toBe("wrong");

    // Click "Try again"
    secondaryBtn.click();

    expect(exercise.status).toBe("incomplete");
    expect(secondaryBtn.classList.contains("hidden")).toBe(true);
    expect(exercise.shadowRoot.querySelectorAll("#pool > *").length).toBe(2);
  });

  it("should dispatch unscramble-result when continue is clicked", () => {
    const component = new UnscramblePage(testData);
    const footer = component.querySelector("#footer");
    const primaryBtn = footer.shadowRoot.getElementById("primary-btn");
    const exercise = component._exercise;

    const getPoolToken = (text) =>
      Array.from(exercise.shadowRoot.querySelectorAll("#pool > *")).find(
        (el) => el.querySelector(".token-text").textContent === text,
      );

    getPoolToken("你").click();
    getPoolToken("好").click();

    const resultSpy = vi.fn();
    component.element.addEventListener("unscramble-result", resultSpy);

    primaryBtn.click();

    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new UnscramblePage({});
      }).toThrow();
    });
  });
});
