import { describe, it, expect, beforeEach } from "vitest";
import "./icon_button.js";

describe("UiIconButton Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("ui-icon-button");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("ui-icon-button")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should update button title and disabled state based on attributes", () => {
    element.setAttribute("title", "Play");
    element.setAttribute("disabled", "");

    const btn = element.shadowRoot.querySelector("button");
    expect(btn.title).toBe("Play");
    expect(btn.hasAttribute("disabled")).toBe(true);

    element.removeAttribute("disabled");
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("should apply correct class based on variant", () => {
    const btn = element.shadowRoot.querySelector("button");

    element.setAttribute("variant", "filled");
    expect(btn.classList.contains("btn-filled")).toBe(true);
    expect(btn.classList.contains("btn-outline")).toBe(false);

    element.setAttribute("variant", "outline");
    expect(btn.classList.contains("btn-outline")).toBe(true);
    expect(btn.classList.contains("btn-filled")).toBe(false);
  });
});
