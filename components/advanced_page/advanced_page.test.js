import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdvancedPage } from "./advanced_page.js";

describe("AdvancedPage", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.localStorage.clear();

    // Mock speech synthesis
    vi.stubGlobal("speechSynthesis", {
      getVoices: vi.fn(() => [
        { name: "Voice 1", lang: "zh-HK" },
        { name: "Voice 2", lang: "en-US" },
        { name: "Voice 3", lang: "zh-HK" },
      ]),
      cancel: vi.fn(),
      speak: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("should render correctly", () => {
    const page = new AdvancedPage();
    expect(page.element).toBeDefined();
    expect(page.shadowRoot.querySelector("h1").textContent).toBe("Advanced Settings");
  });

  it("should render voice settings section", () => {
    const page = new AdvancedPage();
    const voiceSection = page.shadowRoot.querySelector(".settings-card");
    expect(voiceSection.querySelector("h2").textContent).toBe("Cantonese Voice");
  });

  it("should list Cantonese voices in the select dropdown", () => {
    const page = new AdvancedPage();
    const options = page.shadowRoot.querySelectorAll("select option");

    // zh-HK voices are Voice 1 and Voice 3.
    // Logic reverses them, so Voice 3 should be first.
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain("Voice 3");
    expect(options[1].textContent).toContain("Voice 1");
  });

  it("should select the preferred voice from localStorage", () => {
    window.localStorage.setItem("cantonese_preferred_voice_name", "Voice 1");
    const page = new AdvancedPage();
    const select = page.shadowRoot.querySelector("select");
    expect(select.options[select.selectedIndex].textContent).toContain("Voice 1");
  });

  it("should save voice preference and show status message when save button is clicked", () => {
    vi.useFakeTimers();
    const page = new AdvancedPage();
    const select = page.shadowRoot.querySelector("select");
    // The second button in the action row is the Save button
    const saveBtnHost = page.shadowRoot.querySelectorAll(".action-row > *")[1];
    const saveBtn = saveBtnHost.shadowRoot.querySelector("button");
    const statusMsg = page.shadowRoot.querySelector(".status-message");

    // Select Voice 1 (index 1 in the reversed list)
    select.selectedIndex = 1;
    saveBtn.click();

    expect(window.localStorage.getItem("cantonese_preferred_voice_name")).toBe("Voice 1");
    expect(statusMsg.textContent).toBe("Saved preferred voice: Voice 1");
    expect(statusMsg.classList.contains("visible")).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(statusMsg.classList.contains("visible")).toBe(false);
    vi.useRealTimers();
  });
});
