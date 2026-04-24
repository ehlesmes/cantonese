import { describe, it, expect, beforeEach } from "vitest";
import "./tooltip.js";

describe("UiTooltip Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("ui-tooltip");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("ui-tooltip")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should render slots correctly", () => {
    element.innerHTML = `
      <span slot="trigger">Hover me</span>
      <div slot="content">Tooltip info</div>
    `;

    const triggerSlot = element.shadowRoot.querySelector('slot[name="trigger"]');
    const contentSlot = element.shadowRoot.querySelector('slot[name="content"]');

    expect(triggerSlot).not.toBeNull();
    expect(contentSlot).not.toBeNull();
    
    expect(element.querySelector('[slot="trigger"]').textContent).toBe("Hover me");
    expect(element.querySelector('[slot="content"]').textContent).toBe("Tooltip info");
  });
});
