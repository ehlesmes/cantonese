import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonViewer } from "./lesson_viewer.js";
// Important: Import pages to register them in PageRegistry
import "../reading_page/reading_page.js";
import "../explanation_page/explanation_page.js";

describe("LessonViewer Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    // Default fetch mock to avoid network noise in basic tests
    global.window.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ id: "1.1", name: "Test Lesson", pages: [] }),
      }),
    );
  });

  it("should be defined", () => {
    const component = new LessonViewer({
      data: { lessonId: "1.1", lessonName: "test" },
    });
    expect(component).toBeDefined();
    expect(component.element).toBeDefined();
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should propagate lesson-name to the lesson-header", () => {
    const component = new LessonViewer({
      data: {
        lessonId: "1.1",
        lessonName: "Unit 1: Basics",
      },
    });
    document.body.appendChild(component.element);
    // LessonHeader also has a shadowRoot. We need to go into it.
    const headerEl =
      component.shadowRoot.getElementById("header-root").firstChild;
    const titleEl = headerEl.shadowRoot.getElementById("lesson-title");
    expect(titleEl.textContent).toBe("Unit 1: Basics");
  });

  describe("Lesson Loading & Navigation", () => {
    const mockLessonData = {
      id: "1.1",
      name: "Mock Lesson",
      pages: [
        {
          type: "explanation",
          id: "1.1.1",
          content: [{ type: "title", value: "Intro" }],
        },
        { type: "reading", id: "1.1.2" },
      ],
    };

    const mockExerciseData = {
      cantonesePhrase: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };

    beforeEach(() => {
      global.window.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes("lessons")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLessonData),
          });
        }
        if (url.includes("exercises")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExerciseData),
          });
        }
        return Promise.reject(new Error("Not found"));
      });
    });

    it("should load lesson data and render the first page", async () => {
      const component = new LessonViewer({ data: { lessonId: "1.1" } });
      document.body.appendChild(component.element);

      // Wait for the component to finish loading
      await component.ready;

      expect(component.data.lessonName).toBe("Mock Lesson");
      const main = component.shadowRoot.getElementById("m");
      const pageEl = main.firstChild;
      // ExplanationPage has a class page-container in its shadowRoot
      expect(pageEl.shadowRoot.querySelector(".page-container")).not.toBeNull();
      expect(pageEl.shadowRoot.querySelector("h1").textContent).toBe("Intro");
    });

    it("should navigate between pages", async () => {
      const component = new LessonViewer({ data: { lessonId: "1.1" } });
      document.body.appendChild(component.element);

      await component.ready;

      // Navigate to second page and await completion
      await component.navigateTo(1);

      const main = component.shadowRoot.getElementById("m");
      const pageEl = main.firstChild;
      // ReadingPage has an exercise with id "exercise" in its shadowRoot
      const exerciseEl = pageEl.shadowRoot.getElementById("exercise");
      expect(
        exerciseEl.shadowRoot.querySelector(".reading-wrapper"),
      ).not.toBeNull();
    });

    it("should navigate forward on page events", async () => {
      const component = new LessonViewer({ data: { lessonId: "1.1" } });
      document.body.appendChild(component.element);

      await component.ready;

      // Simulate event from current page
      const main = component.shadowRoot.getElementById("m");
      const innerPageEl = main.firstChild;

      innerPageEl.dispatchEvent(
        new CustomEvent("explanation-complete", {
          bubbles: true,
          composed: true,
        }),
      );

      // Page updates are triggered by events which might call navigateTo
      await component.ready;

      const newPageEl = main.firstChild;
      const exerciseEl = newPageEl.shadowRoot.getElementById("exercise");
      expect(
        exerciseEl.shadowRoot.querySelector(".reading-wrapper"),
      ).not.toBeNull();
    });

    it("should navigate back when 'prev' event is received", async () => {
      const component = new LessonViewer({ data: { lessonId: "1.1" } });
      document.body.appendChild(component.element);

      await component.ready;

      // Navigate to second page
      await component.navigateTo(1);
      const main = component.shadowRoot.getElementById("m");
      const exerciseEl = main.firstChild.shadowRoot.getElementById("exercise");
      expect(
        exerciseEl.shadowRoot.querySelector(".reading-wrapper"),
      ).not.toBeNull();

      // Simulate 'prev' event
      component.element.dispatchEvent(
        new CustomEvent("prev", { bubbles: true, composed: true }),
      );
      await component.ready;

      // Should be back on page 1 (explanation)
      expect(
        main.firstChild.shadowRoot.querySelector(".page-container"),
      ).not.toBeNull();
    });

    it("should reset to first page when 'restart' event is received", async () => {
      const component = new LessonViewer({ data: { lessonId: "1.1" } });
      document.body.appendChild(component.element);

      await component.ready;

      // Navigate to second page
      await component.navigateTo(1);
      const main = component.shadowRoot.getElementById("m");
      const exerciseEl = main.firstChild.shadowRoot.getElementById("exercise");
      expect(
        exerciseEl.shadowRoot.querySelector(".reading-wrapper"),
      ).not.toBeNull();

      // Simulate 'restart' event
      component.element.dispatchEvent(
        new CustomEvent("restart", { bubbles: true, composed: true }),
      );
      await component.ready;

      // Should be back on page 1 (explanation)
      expect(
        main.firstChild.shadowRoot.querySelector(".page-container"),
      ).not.toBeNull();
    });
  });
});
