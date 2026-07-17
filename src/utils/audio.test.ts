import { describe, test, expect } from "vitest";
import { getAudioHash } from "./audio.js";

describe("Cantonese Audio Hashing Utility", () => {
  test("returns hash for empty text", () => {
    // SHA-256 of empty string is e3b0c44298fc1c14...
    // Slice to 16 characters is e3b0c44298fc1c14
    expect(getAudioHash("")).toBe("e3b0c44298fc1c14");
    expect(getAudioHash(null)).toBe("e3b0c44298fc1c14");
  });

  test("returns stable 16-character hex hash matching standard SHA-256 slice", () => {
    // "你好" clean string
    // SHA-256 hex digest of "你好" is 670d9743542cae3e...
    // Slice to 16 characters is 670d9743542cae3e
    expect(getAudioHash("你好")).toBe("670d9743542cae3e");
    expect(getAudioHash("你好[nei5hou2|hello]")).toBe("670d9743542cae3e");
    expect(getAudioHash("`你好[nei5hou2|hello]`")).toBe("670d9743542cae3e");
  });

  test("generates different hashes for different phrases", () => {
    const hash1 = getAudioHash("你好");
    const hash2 = getAudioHash("早晨");
    expect(hash1).not.toBe(hash2);
    expect(hash1.length).toBe(16);
    expect(hash2.length).toBe(16);
  });
});
