import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExplanationPage } from "./explanation_page.js";

describe("ExplanationPage Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new ExplanationPage({ data: { content: [] } });
    expect(component).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should render title and text content", () => {
    const component = new ExplanationPage({
      data: {
        content: [
          { type: "title", value: "Test Title" },
          { type: "text", value: "Test Text" },
        ],
      },
    });

    const content = component.shadowRoot.getElementById("content");
    expect(content.querySelector("h1").textContent).toBe("Test Title");
    expect(content.querySelector("p").textContent).toBe("Test Text");
  });

  it("should render bold text using <strong> correctly", () => {
    const component = new ExplanationPage({
      data: {
        content: [{ type: "text", value: "Hello <strong>World</strong>" }],
      },
    });

    const content = component.shadowRoot.getElementById("content");
    const p = content.querySelector("p");
    expect(p.innerHTML).toContain("<strong>World</strong>");
  });

  it("should dispatch explanation-complete when footer primary button is clicked", () => {
    const component = new ExplanationPage({
      data: {
        content: [{ type: "title", value: "Title" }],
      },
    });

    const spy = vi.fn();
    component.element.addEventListener("explanation-complete", spy);

    // Finding the footer inside shadowRoot
    const footer =
      component.shadowRoot.querySelector("div[id='footer']") ||
      component._footer;
    footer.element.dispatchEvent(
      new CustomEvent("primary-click", { bubbles: true, composed: true }),
    );

    expect(spy).toHaveBeenCalled();
  });
});
