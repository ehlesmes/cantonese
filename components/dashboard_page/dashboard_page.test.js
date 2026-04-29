import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardPage } from "./dashboard_page.js";
import { Routes } from "../shared/routes.js";
import { Progress } from "../shared/progress.js";

describe("DashboardPage Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.spyOn(Progress, "startLesson");
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

    expect(window.location.hash).toBe(Routes.PRACTICE);
  });

  it("should navigate to lesson and call startLesson when next lesson card is clicked", () => {
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

    expect(Progress.startLesson).toHaveBeenCalledWith("1.1", true);
    expect(window.location.hash).toBe(Routes.lesson("1.1"));
  });

  it("should navigate to lesson and call startLesson when lesson row is clicked", () => {
    const page = new DashboardPage();
    page._chapters = [
      {
        chapterId: "1",
        chapterName: "Chapter 1",
        lessons: [{ lessonId: "1.2", lessonName: "Lesson 2" }],
      },
    ];
    page.updateContent();

    // The event is bubbling up to _container
    const roadmap = page.shadowRoot.querySelector(".roadmap-container");
    const accordionHost = roadmap.querySelector("div"); // host for ChapterAccordion
    const accordion = accordionHost.component;

    const chapterItemHost =
      accordion.shadowRoot.querySelector(".chapter-accordion").firstChild;
    const chapterItem = chapterItemHost.component;

    const lessonRowHost =
      chapterItem.shadowRoot.querySelector(".lesson-list").firstChild;
    const innerRow = lessonRowHost.shadowRoot.querySelector(".lesson-row");

    innerRow.click();

    expect(Progress.startLesson).toHaveBeenCalledWith("1.2", true);
    expect(window.location.hash).toBe(Routes.lesson("1.2"));
  });
});
