/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { compileAnnotationsClient } from "./dom.js";

describe("DOM Utilities Spec", () => {
  describe("compileAnnotationsClient", () => {
    test("returns empty string if falsy input", () => {
      expect(compileAnnotationsClient("")).toBe("");
    });

    test("leaves text without annotations unchanged", () => {
      expect(compileAnnotationsClient("hello world")).toBe("hello world");
    });

    test("compiles single character with jyutping and translation hidden", () => {
      const input = "我[ngo5|I]";
      const output = compileAnnotationsClient(input, true);
      expect(output).toContain(
        '<span class="vocab-term" data-audio-hash="">我',
      );
      expect(output).toContain("<strong>ngo5</strong>");
      expect(output).not.toContain("I");
    });

    test("compiles single character with translation shown", () => {
      const input = "我[ngo5|I]";
      const output = compileAnnotationsClient(input, false);
      expect(output).toContain(
        '<span class="vocab-term" data-audio-hash="">我',
      );
      expect(output).toContain("<strong>ngo5</strong>");
      expect(output).toContain("I");
    });

    test("injects audio hash from tokenHashes", () => {
      const input = "我[ngo5|I]";
      const tokenHashes = { 我: "hash-123" };
      const output = compileAnnotationsClient(input, true, tokenHashes);
      expect(output).toContain('data-audio-hash="hash-123"');
    });

    test("handles multiple annotations in a string", () => {
      const input = "我[ngo5|I]好[hou2|good]";
      const output = compileAnnotationsClient(input, true);
      expect(output).toContain("我");
      expect(output).toContain("ngo5");
      expect(output).toContain("好");
      expect(output).toContain("hou2");
    });
  });
});

export {};
