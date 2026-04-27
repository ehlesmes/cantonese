import { describe, it, expect, beforeEach, vi } from "vitest";
import { PracticeSummaryPage } from "./practice_summary_page.js";

describe("PracticeSummaryPage Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should be defined", () => {
    const component = new PracticeSummaryPage({ score: 8, total: 10 });
    expect(component).toBeDefined();
  });

  it("should display the correct score", () => {
    const component = new PracticeSummaryPage({ score: 7, total: 10 });
    const scoreDisplay = component.shadowRoot.querySelector(".score-display");
    expect(scoreDisplay.textContent).toBe("7 / 10");
  });

  it("should display perfect message for 100% score", () => {
    const component = new PracticeSummaryPage({ score: 10, total: 10 });
    const message = component.shadowRoot.querySelector("p");
    expect(message.textContent).toBe("Perfect! 加油!");
  });

  it("should display encouragement message for partial score", () => {
    const component = new PracticeSummaryPage({ score: 5, total: 10 });
    const message = component.shadowRoot.querySelector("p");
    expect(message.textContent).toBe("Good job! Keep practicing!");
  });

  it("should dispatch retry-practice on primary click", () => {
    const component = new PracticeSummaryPage({ score: 8, total: 10 });
    const spy = vi.fn();
    component.element.addEventListener("retry-practice", spy);

    component.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );
    expect(spy).toHaveBeenCalled();
  });

  it("should dispatch go-home on secondary click", () => {
    const component = new PracticeSummaryPage({ score: 8, total: 10 });
    const spy = vi.fn();
    component.element.addEventListener("go-home", spy);

    component.element.dispatchEvent(
      new CustomEvent("secondary-click", { bubbles: true, composed: true }),
    );
    expect(spy).toHaveBeenCalled();
  });
});
