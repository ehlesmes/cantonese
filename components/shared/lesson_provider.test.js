import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonProvider } from "./lesson_provider.js";

describe("LessonProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LessonProvider._manifestCache = null;
    LessonProvider._manifestPromise = null;
    LessonProvider._lessonCache.clear();

    // Mock global fetch
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("getManifest", () => {
    it("should fetch and cache the manifest", async () => {
      const mockManifest = {
        version: 1,
        chapters: [
          {
            chapterId: "1",
            chapterName: "Basic",
            lessons: [{ lessonId: "1.1", lessonName: "Hi" }],
          },
        ],
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      });

      const manifest1 = await LessonProvider.getManifest();
      expect(manifest1).toEqual(mockManifest);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith("data/lessons.json");

      // Second call should use cache
      const manifest2 = await LessonProvider.getManifest();
      expect(manifest2).toEqual(mockManifest);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should handle fetch errors", async () => {
      fetch.mockResolvedValue({
        ok: false,
      });

      await expect(LessonProvider.getManifest()).rejects.toThrow(
        "Failed to load lessons.json",
      );
    });
  });

  describe("getLessonData", () => {
    it("should fetch and cache lesson detail", async () => {
      const mockLesson = {
        version: 1,
        pages: [{ pageId: "1.1.1", type: "reading" }],
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockLesson,
      });

      const data1 = await LessonProvider.getLessonData("1.1");
      expect(data1).toEqual(mockLesson);
      expect(fetch).toHaveBeenCalledWith("data/lessons/1/1.1.json");

      // Second call should use cache
      const data2 = await LessonProvider.getLessonData("1.1");
      expect(data2).toEqual(mockLesson);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should handle missing lesson file", async () => {
      fetch.mockResolvedValue({
        ok: false,
      });

      await expect(LessonProvider.getLessonData("1.1")).rejects.toThrow(
        "Failed to load lesson: 1.1",
      );

      expect(console.error).toHaveBeenCalledWith(
        "🚨 [LessonProvider ERROR]: Failed to load lesson: 1.1",
      );
      vi.mocked(console.error).mockClear();
    });
  });

  describe("getLessonName", () => {
    it("should resolve lesson name from manifest", async () => {
      const mockManifest = {
        version: 1,
        chapters: [
          {
            chapterId: "1",
            chapterName: "Introduction",
            lessons: [{ lessonId: "1.1", lessonName: "Greetings" }],
          },
        ],
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      });

      const name = await LessonProvider.getLessonName("1.1");
      expect(name).toBe("Greetings");
    });

    it("should return 'Unknown Lesson' if not found", async () => {
      const mockManifest = {
        version: 1,
        chapters: [],
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      });

      const name = await LessonProvider.getLessonName("9.9");
      expect(name).toBe("Unknown Lesson");
    });
  });
});
