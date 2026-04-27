import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppShell } from "./app_shell.js";
import { PageRegistry } from "../shared/page_registry.js";

describe("AppShell Component", () => {
  beforeEach(() => {
    // Stub fetch for LessonProvider and other data loading
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url) => {
        if (url === "data/lessons.json") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                chapters: [
                  {
                    chapterId: "1",
                    chapterName: "Chapter 1",
                    lessons: [
                      { lessonId: "1.1", lessonName: "Test Lesson 1.1" },
                    ],
                  },
                ],
              }),
          });
        }
        if (url === "data/lessons/1/1.1.json") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  type: "explanation",
                  content: [{ type: "text", value: "test" }],
                },
              ]),
          });
        }
        return Promise.reject(new Error(`Unknown fetch URL: ${url}`));
      }),
    );

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

  it("should load PracticeViewer when navigating to #/practice", async () => {
    const shell = new AppShell();
    window.location.hash = "#/practice";
    await shell.handleRoute();

    // PracticeViewer uses a shadow root, so we check for the existence of the element
    // by looking for the child node that is the PracticeViewer instance.
    expect(shell._currentView.constructor.name).toBe("PracticeViewer");
  });

  it("should load LessonViewer when navigating to #/lesson/1.1", async () => {
    const shell = new AppShell();
    window.location.hash = "#/lesson/1.1";
    await shell.handleRoute();

    expect(shell._currentView.constructor.name).toBe("LessonViewer");
  });
});
