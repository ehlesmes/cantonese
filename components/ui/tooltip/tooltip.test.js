import { describe, it, expect, beforeEach } from "vitest";
import { Tooltip } from "./tooltip.js";

describe("Tooltip Component", () => {
  const trigger = document.createElement("span");
  trigger.innerText = "Hover me";

  const content = document.createElement("div");
  content.innerText = "Tooltip info";

  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if trigger is missing", () => {
      expect(() => new Tooltip({ content })).toThrow();
    });

    it("should throw if content is missing", () => {
      expect(() => new Tooltip({ trigger })).toThrow();
    });
  });

  it("should be defined", () => {
    const component = new Tooltip({ trigger, content });
    expect(component).toBeInstanceOf(Tooltip);
    expect(component.element).toBeInstanceOf(HTMLElement);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should render slots correctly", () => {
    const component = new Tooltip({ trigger, content });

    const triggerSlot = component.shadowRoot.querySelector(
      'slot[name="trigger"]',
    );
    const contentSlot = component.shadowRoot.querySelector(
      'slot[name="content"]',
    );

    expect(triggerSlot).not.toBeNull();
    expect(contentSlot).not.toBeNull();

    // The slotted elements should be assigned to the slots
    const assignedTrigger = triggerSlot.assignedNodes()[0];
    const assignedContent = contentSlot.assignedNodes()[0];

    expect(assignedTrigger.textContent).toBe("Hover me");
    expect(assignedContent.textContent).toBe("Tooltip info");
  });
});
