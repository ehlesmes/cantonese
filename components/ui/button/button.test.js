import { describe, it, expect, beforeEach, vi } from "vitest";
import { Button } from "./button.js";

describe("Button Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should render with a label", () => {
    const component = new Button({ label: "Click Me" });
    const button = component.shadowRoot.querySelector("button");
    expect(button.textContent).toBe("Click Me");
    expect(button.classList.contains("text-button")).toBe(true);
  });

  it("should render with an icon", () => {
    const component = new Button({ icon: "home" });
    const button = component.shadowRoot.querySelector("button");
    const iconSpan = button.querySelector(".material-symbols-outlined");
    expect(iconSpan.textContent).toBe("home");
    expect(button.classList.contains("icon-button")).toBe(true);
  });

  it("should apply variant classes", () => {
    const filled = new Button({ label: "Filled", variant: "filled" });
    expect(
      filled.shadowRoot
        .querySelector("button")
        .classList.contains("btn-filled"),
    ).toBe(true);

    const outline = new Button({ label: "Outline", variant: "outline" });
    expect(
      outline.shadowRoot
        .querySelector("button")
        .classList.contains("btn-outline"),
    ).toBe(true);
  });

  it("should handle disabled state", () => {
    const component = new Button({ label: "Disabled", disabled: true });
    const button = component.shadowRoot.querySelector("button");
    expect(button.disabled).toBe(true);

    component.disabled = false;
    expect(button.disabled).toBe(false);
  });

  it("should update label via setter", () => {
    const component = new Button({ label: "Initial" });
    component.label = "Updated";
    expect(component.shadowRoot.querySelector("button").textContent).toBe(
      "Updated",
    );
  });

  it("should dispatch click event", () => {
    const component = new Button({ label: "Click" });
    const spy = vi.fn();
    component.element.addEventListener("click", spy);

    component.shadowRoot.querySelector("button").click();
    expect(spy).toHaveBeenCalled();
  });

  it("should throw error if neither label nor icon is provided", () => {
    expect(() => new Button({})).toThrow(
      "Button must have either a label or an icon",
    );
  });

  it("should throw error if both label and icon are provided", () => {
    expect(() => new Button({ label: "L", icon: "i" })).toThrow(
      "Button cannot have both a label and an icon",
    );
  });
});
