import { describe, it, expect, beforeEach, vi } from "vitest";
import "./lesson_viewer.js";

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

  it("should be defined and upgraded", () => {
    const el = document.createElement("lesson-viewer");
    el.data = { lessonId: "1.1", lessonName: "test" };
    document.body.appendChild(el);
    expect(customElements.get("lesson-viewer")).toBeDefined();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  it("should propagate lesson-name to the lesson-header", () => {
    const el = document.createElement("lesson-viewer");
    el.data = { lessonId: "1.1", lessonName: "Unit 1: Basics" };
    document.body.appendChild(el);
    const header = el.shadowRoot.getElementById("header");
    expect(header.data.lessonName).toBe("Unit 1: Basics");
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
      const el = document.createElement("lesson-viewer");
      el.data = { lessonId: "1.1" };
      document.body.appendChild(el);

      // Wait for the component to finish loading
      await el.ready;

      expect(el.data.lessonName).toBe("Mock Lesson");
      const main = el.shadowRoot.getElementById("m");
      expect(main.querySelector("explanation-page")).not.toBeNull();
    });

    it("should navigate between pages", async () => {
      const el = document.createElement("lesson-viewer");
      el.data = { lessonId: "1.1" };
      document.body.appendChild(el);

      await el.ready;

      // Navigate to second page and await completion
      await el.navigateTo(1);

      const main = el.shadowRoot.getElementById("m");
      expect(main.querySelector("reading-page")).not.toBeNull();
    });

    it("should navigate forward on page events", async () => {
      const el = document.createElement("lesson-viewer");
      el.data = { lessonId: "1.1" };
      document.body.appendChild(el);

      await el.ready;

      // Simulate event from current page (explanation-page)
      const main = el.shadowRoot.getElementById("m");
      const innerPage = main.querySelector("explanation-page");

      innerPage.dispatchEvent(
        new CustomEvent("explanation-complete", {
          bubbles: true,
          composed: true,
        }),
      );

      // Page updates are triggered by events which might call navigateTo
      await el.ready;

      expect(main.querySelector("reading-page")).not.toBeNull();
    });

    it("should navigate back when 'prev' event is received", async () => {
      const el = document.createElement("lesson-viewer");
      el.data = { lessonId: "1.1" };
      document.body.appendChild(el);

      await el.ready;

      // Navigate to second page
      await el.navigateTo(1);
      const main = el.shadowRoot.getElementById("m");
      expect(main.querySelector("reading-page")).not.toBeNull();

      // Simulate 'prev' event from header
      el.shadowRoot.dispatchEvent(
        new CustomEvent("prev", { bubbles: true, composed: true }),
      );
      await el.ready;

      // Should be back on page 1 (explanation)
      expect(main.querySelector("explanation-page")).not.toBeNull();
    });

    it("should reset to first page when 'restart' event is received", async () => {
      const el = document.createElement("lesson-viewer");
      el.data = { lessonId: "1.1" };
      document.body.appendChild(el);

      await el.ready;

      // Navigate to second page
      await el.navigateTo(1);
      const main = el.shadowRoot.getElementById("m");
      expect(main.querySelector("reading-page")).not.toBeNull();

      // Simulate 'restart' event from header
      el.shadowRoot.dispatchEvent(
        new CustomEvent("restart", { bubbles: true, composed: true }),
      );
      await el.ready;

      // Should be back on page 1 (explanation)
      expect(main.querySelector("explanation-page")).not.toBeNull();
    });
  });

  describe("Validation", () => {
    it("should log error if required data properties are missing", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const el = document.createElement("lesson-viewer");
      document.body.appendChild(el);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required data property 'lessonId'"),
      );

      errorSpy.mockRestore();
    });
  });

  describe("Late Upgrade", () => {
    it("should handle data property set before the element is connected", () => {
      const el = document.createElement("lesson-viewer");
      el.data = { lessonId: "1.1", lessonName: "Greetings" };
      document.body.appendChild(el);
      const header = el.shadowRoot.getElementById("header");
      expect(header.data.lessonName).toBe("Greetings");
    });
  });
});
