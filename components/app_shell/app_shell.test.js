import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppShell } from "./app_shell.js";
import { PageRegistry } from "../shared/page_registry.js";

describe("AppShell Component", () => {
  beforeEach(() => {
    // Register mock for vocabulary to avoid routing errors in tests
    PageRegistry.set(
      "vocabulary",
      class MockPage {
        constructor() {
          this.element = document.createElement("div");
        }
      },
    );

    document.body.replaceChildren();
    window.location.hash = "";
    vi.clearAllMocks();
  });

  it("should render header and main content slots", () => {
    const shell = new AppShell();
    const header = shell.shadowRoot.querySelector(".app-header");
    const main = shell.shadowRoot.querySelector(".app-content");

    expect(header).not.toBeNull();
    expect(main).not.toBeNull();
  });

  it("should navigate to #/home by default if no hash exists", () => {
    new AppShell();
    expect(window.location.hash).toBe("#/home");
  });

  it("should hide navigation in Focus Mode (lessons)", () => {
    window.location.hash = "#/lesson/1.1";
    const shell = new AppShell();
    const header = shell.shadowRoot.querySelector(".app-header");

    expect(header.classList.contains("hidden")).toBe(true);
  });

  it("should hide navigation in Focus Mode (practice)", () => {
    window.location.hash = "#/practice";
    const shell = new AppShell();
    const header = shell.shadowRoot.querySelector(".app-header");

    expect(header.classList.contains("hidden")).toBe(true);
  });

  it("should show navigation for home and vocabulary", () => {
    const shell = new AppShell();
    const header = shell.shadowRoot.querySelector(".app-header");

    window.location.hash = "#/home";
    shell.handleRoute();
    expect(header.classList.contains("hidden")).toBe(false);

    window.location.hash = "#/vocabulary";
    shell.handleRoute();
    expect(header.classList.contains("hidden")).toBe(false);
  });

  it("should allow injecting a navigation component", () => {
    const shell = new AppShell();
    const mockNav = {
      element: document.createElement("div"),
      setActiveHash: vi.fn(),
    };
    mockNav.element.id = "mock-nav";

    shell.nav = mockNav;

    const header = shell.shadowRoot.querySelector(".app-header");
    expect(header.querySelector("#mock-nav")).not.toBeNull();
  });

  it("should update active tab in nav on routing", () => {
    const shell = new AppShell();
    const activeHashSpy = vi.fn();
    const mockNav = {
      element: document.createElement("div"),
      set activeHash(val) {
        activeHashSpy(val);
      },
    };
    shell.nav = mockNav;

    window.location.hash = "#/vocabulary";
    shell.handleRoute();

    expect(activeHashSpy).toHaveBeenCalledWith("#/vocabulary");
  });
});
