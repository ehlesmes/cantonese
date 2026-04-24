import { describe, it, expect, beforeEach } from "vitest";
import "./explanation_page.js";

describe("ExplanationPage Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("explanation-page");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("explanation-page")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should render title, text, and example cards from content attribute", () => {
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
    element.setAttribute("content", JSON.stringify(content));

    const shadowRoot = element.shadowRoot;
    const title = shadowRoot.querySelector("h1");
    const text = shadowRoot.querySelector("p");
    const card = shadowRoot.querySelector("example-card");

    expect(title.textContent).toBe("Hello");
    expect(text.textContent).toBe("This is a test.");
    expect(card.getAttribute("cantonese")).toBe("你好");
  });

  describe("Properties", () => {
    it("should update via content property and reflect to attribute", () => {
      const content = [{ type: "title", value: "New Title" }];
      element.content = content;

      expect(element.getAttribute("content")).toBe(JSON.stringify(content));
      expect(element.shadowRoot.querySelector("h1").textContent).toBe(
        "New Title",
      );
    });
  });
});
