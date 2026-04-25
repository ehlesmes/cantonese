import { describe, it, expect, beforeEach } from "vitest";
import { Tooltip } from "./tooltip.js";

describe("Tooltip Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new Tooltip({
      trigger: document.createElement("div"),
      content: document.createElement("div"),
    });
    expect(component).toBeInstanceOf(Tooltip);
    expect(component.element).toBeInstanceOf(HTMLElement);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should render slots correctly", () => {
    const trigger = document.createElement("span");
    trigger.id = "trigger";
    trigger.innerText = "Hover me";
    const content = document.createElement("div");
    content.id = "content";
    content.innerText = "Tooltip info";

    const component = new Tooltip({ trigger, content });

    expect(component.element.querySelector("#trigger").textContent).toBe(
      "Hover me",
    );
    expect(component.element.querySelector("#content").textContent).toBe(
      "Tooltip info",
    );
  });
});
