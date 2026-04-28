import { describe, it, expect } from "vitest";
import { AdvancedPage } from "./advanced_page.js";

describe("AdvancedPage", () => {
  it("should render correctly", () => {
    document.body.replaceChildren();
    const page = new AdvancedPage();
    expect(page.element).toBeDefined();
    expect(page.shadowRoot.querySelector("h1").textContent).toBe(
      "Advanced Settings",
    );
  });
});
