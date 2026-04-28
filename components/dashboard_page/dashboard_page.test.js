import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardPage } from "./dashboard_page.js";

describe("DashboardPage Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    // Mock fetch for lessons.json
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: 1, chapters: [] }),
        }),
      ),
    );
  });

  it("should render hero and roadmap slots initially", () => {
    const page = new DashboardPage();
    expect(page.shadowRoot.querySelector(".hero-section")).not.toBeNull();
    expect(page.shadowRoot.querySelector(".roadmap-container")).not.toBeNull();
  });

  it("should navigate to practice when practice card is clicked", () => {
    const page = new DashboardPage();
    // Force content update to render cards
    page.updateContent();

    const practiceCard = page.shadowRoot.querySelector("#practice-card");
    practiceCard.component.shadowRoot.querySelector(".action-card").click();

    expect(window.location.hash).toBe("#/practice");
  });

  it("should navigate to lesson when next lesson card is clicked", () => {
    const page = new DashboardPage();
    page._chapters = [
      {
        chapterId: "1",
        chapterName: "Chapter 1",
        lessons: [{ lessonId: "1.1", lessonName: "Lesson 1" }],
      },
    ];
    page.updateContent();

    const nextCard = page.shadowRoot.querySelector("#next-lesson-card");
    nextCard.component.shadowRoot.querySelector(".action-card").click();

    expect(window.location.hash).toBe("#/lesson/1.1");
  });
});
