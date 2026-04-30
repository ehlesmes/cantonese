import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExplanationPage } from "./explanation_page.js";

describe("ExplanationPage Component", () => {
  const testData = {
    content: [
      { type: "title", value: "Test Title" },
      { type: "text", value: "This is <strong>important</strong> text." },
      {
        type: "example",
        cantonese: "你好",
        romanization: "nei5 hou2",
        translation: "Hello",
      },
    ],
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should be defined", () => {
    const component = new ExplanationPage(testData);
    expect(component).toBeInstanceOf(ExplanationPage);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should render all content types", () => {
    const component = new ExplanationPage(testData);
    const content = component.querySelector("#content");

    expect(content.querySelector("h1").textContent).toBe("Test Title");
    expect(content.querySelector("p").textContent).toBe("This is important text.");
    expect(content.querySelector("strong").textContent).toBe("important");

    // ExampleCard is a component, its content is in its shadow DOM
    const exampleCard = content.querySelector("#content > div:last-child");
    expect(exampleCard.shadowRoot.querySelector(".content-row")).not.toBeNull();
  });

  it("should dispatch explanation-complete when Continue is clicked", () => {
    const component = new ExplanationPage(testData);
    const footerEl = component.querySelector("#footer");

    const completeSpy = vi.fn();
    component.element.addEventListener("explanation-complete", completeSpy);

    const primaryBtn = footerEl.shadowRoot.getElementById("primary-btn");
    primaryBtn.click();

    expect(completeSpy).toHaveBeenCalled();
  });

  describe("Validation", () => {
    it("should throw error if required data properties are missing", () => {
      expect(() => {
        new ExplanationPage({});
      }).toThrow();
    });
  });
});
