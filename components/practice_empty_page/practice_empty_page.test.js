import { describe, it, expect, beforeEach, vi } from "vitest";
import { PracticeEmptyPage } from "./practice_empty_page.js";

describe("PracticeEmptyPage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new PracticeEmptyPage();
    expect(component).toBeDefined();
  });

  it("should display empty state message", () => {
    const component = new PracticeEmptyPage();
    const title = component.shadowRoot.querySelector("h1");
    expect(title.textContent).toBe("No exercises yet!");
  });

  it("should dispatch go-home on primary click", () => {
    const component = new PracticeEmptyPage();
    const spy = vi.fn();
    component.element.addEventListener("go-home", spy);

    component.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );
    expect(spy).toHaveBeenCalled();
  });
});
