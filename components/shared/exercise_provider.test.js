import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExerciseProvider } from "./exercise_provider.js";

describe("ExerciseProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ExerciseProvider._cache.clear();

    // Mock global fetch
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("getExercise", () => {
    it("should fetch and cache exercises", async () => {
      const mockExercise = {
        version: 1,
        type: "reading",
        cantonese: "你好",
        romanization: "nei5 hou2",
        translation: "Hello",
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockExercise,
      });

      const path = "1/1/1.1.2.json";
      const data1 = await ExerciseProvider.getExercise(path);
      expect(data1).toEqual(mockExercise);
      expect(fetch).toHaveBeenCalledWith(`data/exercises/${path}`);

      // Second call should use cache
      const data2 = await ExerciseProvider.getExercise(path);
      expect(data2).toEqual(mockExercise);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should handle fetch errors", async () => {
      fetch.mockResolvedValue({
        ok: false,
      });

      await expect(ExerciseProvider.getExercise("bad.json")).rejects.toThrow(
        "Failed to load exercise: bad.json",
      );
    });
  });

  describe("prefetch", () => {
    it("should fetch multiple exercises in parallel", async () => {
      const mockExercise = {
        version: 1,
        type: "reading",
        cantonese: "C",
        romanization: "R",
        translation: "T",
      };
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockExercise,
      });

      const paths = ["1.json", "2.json"];
      ExerciseProvider.prefetch(paths);

      // Wait a bit as prefetch is async and unawaited
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith("data/exercises/1.json");
      expect(fetch).toHaveBeenCalledWith("data/exercises/2.json");
    });
  });
});
