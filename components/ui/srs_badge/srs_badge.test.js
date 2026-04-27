import { describe, it, expect, beforeEach } from "vitest";
import { SrsBadge } from "./srs_badge.js";

describe("SrsBadge Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if level is missing", () => {
      expect(() => new SrsBadge({})).toThrow();
    });
  });

  it("should render with provided level", () => {
    const component = new SrsBadge({ level: 5 });
    const badge = component.shadowRoot.querySelector(".badge");
    expect(badge.textContent).toBe("5");
    expect(badge.classList.contains("level-5")).toBe(true);
  });

  it("should update level via setter", () => {
    const component = new SrsBadge({ level: 1 });
    component.level = 10;
    const badge = component.shadowRoot.querySelector(".badge");
    expect(badge.textContent).toBe("10");
    expect(badge.classList.contains("level-10")).toBe(true);
  });
});
