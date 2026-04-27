import { describe, it, expect, beforeEach } from "vitest";
import { TabNav } from "./tab_nav.js";

describe("TabNav Component", () => {
  const mockTabs = [
    { label: "Home", hash: "#/home" },
    { label: "Vocabulary", hash: "#/vocabulary" },
  ];

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should render all provided tabs", () => {
    const nav = new TabNav({ tabs: mockTabs });
    const buttons = nav.shadowRoot.querySelectorAll(".tab-button");

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe("Home");
    expect(buttons[0].getAttribute("href")).toBe("#/home");
  });

  it("should update active state when setting activeHash", () => {
    const nav = new TabNav({ tabs: mockTabs });

    nav.activeHash = "#/vocabulary";

    const buttons = nav.shadowRoot.querySelectorAll(".tab-button");
    expect(buttons[0].classList.contains("active")).toBe(false);
    expect(buttons[1].classList.contains("active")).toBe(true);
  });

  it("should handle unknown hashes gracefully", () => {
    const nav = new TabNav({ tabs: mockTabs });
    nav.activeHash = "#/unknown";

    const active = nav.shadowRoot.querySelector(".active");
    expect(active).toBeNull();
  });
});
