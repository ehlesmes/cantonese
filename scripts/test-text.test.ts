import { describe, test, expect } from "vitest";
import {
  getCleanSpokenText,
  isPunctuation,
  checkPhraseAnswer,
} from "../src/utils/text.js";

describe("Cantonese Text Cleaner Utility", () => {
  test("returns empty string for null, undefined or empty input", () => {
    expect(getCleanSpokenText(null)).toBe("");
    expect(getCleanSpokenText(undefined)).toBe("");
    expect(getCleanSpokenText("")).toBe("");
  });

  test("returns plain text without changes if no annotations exist", () => {
    expect(getCleanSpokenText("你好")).toBe("你好");
    expect(getCleanSpokenText("早晨！")).toBe("早晨！");
  });

  test("strips standard annotated blocks correctly", () => {
    expect(getCleanSpokenText("早晨[zou2san4|good morning]！")).toBe("早晨！");
    expect(getCleanSpokenText("你好[nei5hou2|hello]")).toBe("你好");
  });

  test("handles backtick-wrapped annotations", () => {
    expect(getCleanSpokenText("`早晨[zou2san4|good morning]`！")).toBe(
      "早晨！",
    );
    expect(getCleanSpokenText("我`鍾意[zung1ji3|like]`你")).toBe("我鍾意你");
  });

  test("strips lingering bracket annotations without characters", () => {
    expect(getCleanSpokenText("你好[nei5hou2]")).toBe("你好");
    expect(getCleanSpokenText("早晨[good]")).toBe("早晨");
  });

  test("handles multiple mixed annotations in one line", () => {
    expect(
      getCleanSpokenText(
        "你`好[nei5hou2|hello]`，我`係[hai6|am]`大衛[daai6wai6|David]。",
      ),
    ).toBe("你好，我係大衛。");
  });

  test("trims leading and trailing whitespace", () => {
    expect(getCleanSpokenText("  你好[nei5hou2|hello]  ")).toBe("你好");
  });
});

describe("isPunctuation Utility", () => {
  test("returns true for standard Chinese punctuation", () => {
    expect(isPunctuation("，")).toBe(true);
    expect(isPunctuation("。")).toBe(true);
    expect(isPunctuation("！")).toBe(true);
    expect(isPunctuation("？")).toBe(true);
    expect(isPunctuation("、")).toBe(true);
    expect(isPunctuation("；")).toBe(true);
    expect(isPunctuation("：")).toBe(true);
  });

  test("returns true for standard ASCII punctuation", () => {
    expect(isPunctuation(",")).toBe(true);
    expect(isPunctuation("?")).toBe(true);
    expect(isPunctuation("!")).toBe(true);
    expect(isPunctuation(";")).toBe(true);
    expect(isPunctuation(":")).toBe(true);
  });

  test("returns false for non-punctuation tokens", () => {
    expect(isPunctuation("你好")).toBe(false);
    expect(isPunctuation("我[ngo5|I]")).toBe(false);
    expect(isPunctuation("")).toBe(false);
    expect(isPunctuation(null)).toBe(false);
    expect(isPunctuation(undefined)).toBe(false);
  });
});

describe("checkPhraseAnswer Utility", () => {
  test("returns true for identical token lists", () => {
    const user = ["我[ngo5|I]", "係[hai6|am]", "人[jan4|human]", "。"];
    const expected = ["我[ngo5|I]", "係[hai6|am]", "人[jan4|human]", "。"];
    expect(checkPhraseAnswer(user, expected)).toBe(true);
  });

  test("returns false for mismatched token list length", () => {
    const user = ["我[ngo5|I]", "係[hai6|am]"];
    const expected = ["我[ngo5|I]", "係[hai6|am]", "人[jan4|human]"];
    expect(checkPhraseAnswer(user, expected)).toBe(false);
  });

  test("returns false for mismatched non-punctuation tokens", () => {
    const user = ["你[nei5|you]", "係[hai6|am]"];
    const expected = ["我[ngo5|I]", "係[hai6|am]"];
    expect(checkPhraseAnswer(user, expected)).toBe(false);
  });

  test("returns true when equivalent punctuation marks are swapped", () => {
    const user = [
      "好[hou2|good]",
      "！",
      "我[ngo5|I]",
      "，",
      "多謝[do1ze6|thanks]",
      "。",
    ];
    const expected = [
      "好[hou2|good]",
      "，",
      "我[ngo5|I]",
      "。",
      "多謝[do1ze6|thanks]",
      "！",
    ];
    expect(checkPhraseAnswer(user, expected)).toBe(true);
  });

  test("returns false if word positions are swapped even if punctuation is correct", () => {
    const user = ["我[ngo5|I]", "好[hou2|good]", "。"];
    const expected = ["好[hou2|good]", "我[ngo5|I]", "。"];
    expect(checkPhraseAnswer(user, expected)).toBe(false);
  });
});
