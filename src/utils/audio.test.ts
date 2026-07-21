import { describe, test, expect } from "vitest";
import { getAudioHash, getTokenHashes } from "./audio.js";

describe("Cantonese Audio Hashing Utility", () => {
  test("returns hash for empty text", async () => {
    // SHA-256 of empty string is e3b0c44298fc1c14...
    // Slice to 16 characters is e3b0c44298fc1c14
    expect(await getAudioHash("")).toBe("e3b0c44298fc1c14");
    expect(await getAudioHash(null)).toBe("e3b0c44298fc1c14");
  });

  test("returns stable 16-character hex hash matching standard SHA-256 slice", async () => {
    // "你好" clean string
    // SHA-256 hex digest of "你好" is 670d9743542cae3e...
    // Slice to 16 characters is 670d9743542cae3e
    expect(await getAudioHash("你好")).toBe("670d9743542cae3e");
    expect(await getAudioHash("你好[nei5hou2|hello]")).toBe("670d9743542cae3e");
    expect(await getAudioHash("`你好[nei5hou2|hello]`")).toBe(
      "670d9743542cae3e",
    );
  });

  test("generates different hashes for different phrases", async () => {
    const hash1 = await getAudioHash("你好");
    const hash2 = await getAudioHash("早晨");
    expect(hash1).not.toBe(hash2);
    expect(hash1.length).toBe(16);
    expect(hash2.length).toBe(16);
  });
});

test("getAudioHash generates deterministic hashes", async () => {
  const h1 = await getAudioHash("你好");
  const h2 = await getAudioHash("你好");
  const h3 = await getAudioHash("唔該");

  expect(h1).toBe(h2);
  expect(h1).not.toBe(h3);

  expect(h1.length).toBeGreaterThan(5);
  expect(typeof h1).toBe("string");
});

describe("Audio Utils Extra Coverage", () => {
  test("getTokenHashes extracts and hashes tokens", async () => {
    const hashes = await getTokenHashes("你[nei5|you] 好[hou2|good]");
    expect(Object.keys(hashes)).toEqual(["你", "好"]);
    expect(hashes["你"]).toBeDefined();
    expect(hashes["好"]).toBeDefined();
  });

  test("getTokenHashes handles empty input", async () => {
    expect(await getTokenHashes(null)).toEqual({});
    expect(await getTokenHashes("")).toEqual({});
    expect(await getTokenHashes("[nei5hou2|hello]")).toEqual({}); // empty char
  });

  test("getAudioHash fallback when subtle crypto is undefined", async () => {
    const originalCrypto = globalThis.crypto;
    // @ts-expect-error - testing fallback
    delete globalThis.crypto;
    const hash = await getAudioHash("你好");
    expect(hash.length).toBe(16);
    globalThis.crypto = originalCrypto;
  });
});
