import { describe, test, expect } from "vitest";
import { getCleanSpokenText, escapeXml, getHash } from "./lib/tts-utils";

describe("TTS Utility Functions Spec", () => {
  describe("getCleanSpokenText", () => {
    test("handles empty and null values", () => {
      expect(getCleanSpokenText("")).toBe("");
      expect(getCleanSpokenText(null)).toBe("");
      expect(getCleanSpokenText(undefined)).toBe("");
    });

    test("strips standard annotated characters", () => {
      expect(getCleanSpokenText("你好[nei5hou2|hello]")).toBe("你好");
      expect(getCleanSpokenText("`你好[nei5hou2|hello]`")).toBe("你好");
    });

    test("strips multiple annotated characters in a sentence", () => {
      expect(
        getCleanSpokenText("我[ngo5|I] 想[soeng2|want] 買[maai5|buy]"),
      ).toBe("我 想 買");
    });

    test("removes lingering bracket parameter blocks", () => {
      expect(getCleanSpokenText("唔該[m4goi1]")).toBe("唔該");
    });

    test("leaves clean text untouched", () => {
      expect(getCleanSpokenText("香港人")).toBe("香港人");
    });
  });

  describe("escapeXml", () => {
    test("escapes XML special characters correctly", () => {
      expect(escapeXml("<hello>")).toBe("&lt;hello&gt;");
      expect(escapeXml("A & B")).toBe("A &amp; B");
      expect(escapeXml("It's fine")).toBe("It&apos;s fine");
      expect(escapeXml('He said "yes"')).toBe("He said &quot;yes&quot;");
    });

    test("leaves text without special characters untouched", () => {
      expect(escapeXml("Normal text 123")).toBe("Normal text 123");
    });
  });

  describe("getHash", () => {
    test("generates stable 16-character SHA-256 hash", async () => {
      const text = "你好";
      const hash1 = await getHash(text);
      const hash2 = await getHash(text);

      expect(hash1).toHaveLength(16);
      expect(hash1).toBe(hash2);
      expect(hash1).toBe("670d9743542cae3e"); // Verified expected output
    });
  });
});
