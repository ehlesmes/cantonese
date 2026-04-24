import { describe, it, expect, beforeEach } from "vitest";
import { IconButton } from "./icon_button.js";

describe("IconButton Component", () => {
  let component;

  beforeEach(() => {
    document.body.innerHTML = "";
    component = new IconButton();
    document.body.appendChild(component.element);
  });

  it("should be defined", () => {
    expect(component).toBeInstanceOf(IconButton);
    expect(component.element).toBeInstanceOf(HTMLElement);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should update button title and disabled state based on data", () => {
    component.data = { title: "Play", disabled: true };

    const btn = component.shadowRoot.querySelector("button");
    expect(btn.title).toBe("Play");
    expect(btn.disabled).toBe(true);

    component.data = { disabled: false };
    expect(btn.disabled).toBe(false);
  });

  it("should apply correct class based on variant", () => {
    const btn = component.shadowRoot.querySelector("button");

    component.data = { variant: "filled" };
    expect(btn.classList.contains("btn-filled")).toBe(true);
    expect(btn.classList.contains("btn-outline")).toBe(false);

    component.data = { variant: "outline" };
    expect(btn.classList.contains("btn-outline")).toBe(true);
    expect(btn.classList.contains("btn-filled")).toBe(false);
  });

  it("should display the icon in the host element textContent", () => {
    const component = new IconButton({ icon: "search" });
    expect(component.element.textContent).toBe("search");

    component.data = { icon: "close" };
    expect(component.element.textContent).toBe("close");
  });
});
