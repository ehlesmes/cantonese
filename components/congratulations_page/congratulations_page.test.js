import { describe, it, expect, beforeEach, vi } from "vitest";
import { CongratulationsPage } from "./congratulations_page.js";

describe("CongratulationsPage Component", () => {
  const testDataWithNext = {
    title: "Lesson Complete!",
    summary: "Great job on finishing the lesson.",
    nextLessonId: "1.2",
  };

  const testDataWithoutNext = {
    title: "All Done!",
    summary: "You have completed the course.",
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should be defined", () => {
    const component = new CongratulationsPage(testDataWithNext);
    expect(component).toBeInstanceOf(CongratulationsPage);
  });

  it("should render title and summary", () => {
    const component = new CongratulationsPage(testDataWithNext);
    expect(component.shadowRoot.querySelector("h1").textContent).toBe("Lesson Complete!");
    expect(component.shadowRoot.querySelector("p").textContent).toBe(
      "Great job on finishing the lesson.",
    );
  });

  it("should show both buttons when nextLessonId is present", () => {
    const component = new CongratulationsPage(testDataWithNext);
    const footer = component.querySelector("#footer");
    const primaryBtn = footer.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = footer.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.component.label).toBe("Next Lesson");
    expect(secondaryBtn.component.label).toBe("Back Home");
    expect(secondaryBtn.classList.contains("hidden")).toBe(false);
  });

  it("should show only Back Home as primary when nextLessonId is missing", () => {
    const component = new CongratulationsPage(testDataWithoutNext);
    const footer = component.querySelector("#footer");
    const primaryBtn = footer.shadowRoot.getElementById("primary-btn");
    const secondaryBtn = footer.shadowRoot.getElementById("secondary-btn");

    expect(primaryBtn.component.label).toBe("Back Home");
    expect(secondaryBtn.classList.contains("hidden")).toBe(true);
  });

  it("should dispatch next-lesson when primary is clicked (with next lesson)", () => {
    const component = new CongratulationsPage(testDataWithNext);
    const footer = component.querySelector("#footer");
    const primaryBtn = footer.shadowRoot.getElementById("primary-btn");

    const spy = vi.fn();
    component.element.addEventListener("next-lesson", spy);

    primaryBtn.click();

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].detail.nextLessonId).toBe("1.2");
  });

  it("should dispatch go-home when primary is clicked (without next lesson)", () => {
    const component = new CongratulationsPage(testDataWithoutNext);
    const footer = component.querySelector("#footer");
    const primaryBtn = footer.shadowRoot.getElementById("primary-btn");

    const spy = vi.fn();
    component.element.addEventListener("go-home", spy);

    primaryBtn.click();

    expect(spy).toHaveBeenCalled();
  });

  it("should dispatch go-home when secondary is clicked (with next lesson)", () => {
    const component = new CongratulationsPage(testDataWithNext);
    const footer = component.querySelector("#footer");
    const secondaryBtn = footer.shadowRoot.getElementById("secondary-btn");

    const spy = vi.fn();
    component.element.addEventListener("go-home", spy);

    secondaryBtn.click();

    expect(spy).toHaveBeenCalled();
  });
});
