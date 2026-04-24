import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExplanationPage } from "./explanation_page.js";

describe("ExplanationPage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new ExplanationPage({
      content: [{ type: "title", value: "test" }],
    });
    expect(component).toBeDefined();
    expect(component.element).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should render title, text, and example cards from content property via data", () => {
    const content = [
      { type: "title", value: "Hello" },
      { type: "text", value: "This is a test." },
      {
        type: "example",
        cantonese: "你好",
        romanization: "nei5 hou2",
        translation: "Hello",
      },
    ];
    const component = new ExplanationPage({ content });
    document.body.appendChild(component.element);

    const shadowRoot = component.shadowRoot;
    const title = shadowRoot.querySelector("h1");
    const text = shadowRoot.querySelector("p");
    // The example card is now a div with a shadow root
    const cardEl = shadowRoot.querySelector("#content > div:last-child");

    expect(title.textContent).toBe("Hello");
    expect(text.textContent).toBe("This is a test.");
    expect(cardEl.shadowRoot.querySelector(".cantonese-text").textContent).toBe(
      "你好",
    );
  });

  it("should correctly return internal state via the data getter", () => {
    const testData = {
      content: [{ type: "title", value: "Hello" }],
    };
    const component = new ExplanationPage(testData);
    expect(component.data).toEqual(testData);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const component = new ExplanationPage();
      component.validate();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });
});
