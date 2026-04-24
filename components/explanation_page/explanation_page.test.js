import { describe, it, expect, beforeEach, vi } from "vitest";
import "./explanation_page.js";

describe("ExplanationPage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined and upgraded", () => {
    const el = document.createElement("explanation-page");
    el.data = { content: [{ type: "title", value: "test" }] };
    document.body.appendChild(el);
    expect(customElements.get("explanation-page")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
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
    const el = document.createElement("explanation-page");
    el.data = { content };
    document.body.appendChild(el);

    const shadowRoot = el.shadowRoot;
    const title = shadowRoot.querySelector("h1");
    const text = shadowRoot.querySelector("p");
    const card = shadowRoot.querySelector("example-card");

    expect(title.textContent).toBe("Hello");
    expect(text.textContent).toBe("This is a test.");
    expect(card.data.cantonese).toBe("你好");
  });

  it("should correctly return internal state via the data getter", () => {
    const testData = {
      content: [{ type: "title", value: "Hello" }],
    };
    const el = document.createElement("explanation-page");
    el.data = testData;
    document.body.appendChild(el);
    expect(el.data).toEqual(testData);
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("explanation-page");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("explanation-page");
      el.data = { content: [{ type: "title", value: "Hello" }] };
      document.body.appendChild(el);
      expect(el.shadowRoot.querySelector("h1").textContent).toBe("Hello");
    });
  });
});
