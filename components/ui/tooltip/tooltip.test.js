import { describe, it, expect, beforeEach } from "vitest";
import { Tooltip } from "./tooltip.js";

describe("Tooltip Component", () => {
  let component;

  beforeEach(() => {
    document.body.innerHTML = "";
    component = new Tooltip();
    document.body.appendChild(component.element);
  });

  it("should be defined", () => {
    expect(component).toBeInstanceOf(Tooltip);
    expect(component.element).toBeInstanceOf(HTMLElement);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should render slots correctly", () => {
    component.element.innerHTML = `
      <span slot="trigger">Hover me</span>
      <div slot="content">Tooltip info</div>
    `;

    const triggerSlot = component.shadowRoot.querySelector(
      'slot[name="trigger"]',
    );
    const contentSlot = component.shadowRoot.querySelector(
      'slot[name="content"]',
    );

    expect(triggerSlot).not.toBeNull();
    expect(contentSlot).not.toBeNull();

    expect(
      component.element.querySelector('[slot="trigger"]').textContent,
    ).toBe("Hover me");
    expect(
      component.element.querySelector('[slot="content"]').textContent,
    ).toBe("Tooltip info");
  });
});
