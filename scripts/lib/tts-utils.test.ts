import { describe, test, expect } from "vitest";
import { extractTTSStrings, escapeXml, getHash } from "./tts-utils.js";

describe("TTS Utils - escapeXml", () => {
  test("escapes special characters", () => {
    expect(escapeXml("<")).toBe("&lt;");
    expect(escapeXml(">")).toBe("&gt;");
    expect(escapeXml("&")).toBe("&amp;");
    expect(escapeXml("'")).toBe("&apos;");
    expect(escapeXml('"')).toBe("&quot;");
  });

  test("leaves normal text unchanged", () => {
    expect(escapeXml("hello")).toBe("hello"); // hits default branch
  });
});

describe("TTS Utils - getHash", () => {
  test("returns hash string", () => {
    expect(typeof getHash("test")).toBe("string");
  });
});

describe("TTS Utils - extractTTSStrings", () => {
  test("extracts vocabulary strings matching chapter file", () => {
    const chaptersData = [{ id: "01-intro", file: "01-intro.md", blocks: [] }];
    const vocabList = [
      { character: "早晨", firstIntroducedIn: "01-intro.md" },
      { character: "唔該", firstIntroducedIn: "02-food.md" },
    ];

    const strings = extractTTSStrings(chaptersData, vocabList, false);
    expect(strings).toContain("早晨");
    expect(strings).not.toContain("唔該");
  });

  test("extracts strings from cantonese blocks", () => {
    const chaptersData = [
      {
        id: "01-intro",
        file: "01-intro.md",
        blocks: [
          {
            type: "cantonese",
            content: "早晨[zou2san4|good morning]\n===\nGood morning",
          },
        ],
      },
    ];

    const strings = extractTTSStrings(chaptersData, [], false);
    expect(strings).toContain("早晨");
  });

  test("extracts strings from dialog blocks", () => {
    const chaptersData = [
      {
        id: "01-intro",
        file: "01-intro.md",
        blocks: [
          {
            type: "dialog",
            content:
              "A: 你好[nei5hou2|hello]\n===\nHello\nB: 早晨[zou2san4|good morning]\n===\nGood morning",
          },
        ],
      },
    ];

    const strings = extractTTSStrings(chaptersData, [], false);
    expect(strings).toContain("你好");
    expect(strings).toContain("早晨");
  });

  test("extracts strings from prose blocks", () => {
    const chaptersData = [
      {
        id: "01-intro",
        file: "01-intro.md",
        blocks: [
          {
            type: "prose",
            content:
              "Here is an inline `唔該[m4goi1|thanks]` and a block 靚仔[leng3zai2|handsome boy].",
          },
        ],
      },
    ];

    const strings = extractTTSStrings(chaptersData, [], false);
    expect(strings).toContain("唔該");
    expect(strings).toContain("靚仔");
  });

  test("deduplicates identical extracted strings", () => {
    const chaptersData = [
      {
        id: "01-intro",
        file: "01-intro.md",
        blocks: [
          {
            type: "cantonese",
            content: "早晨[zou2san4|good morning]\n===\nGood morning",
          },
          {
            type: "dialog",
            content: "A: 早晨[zou2san4|good morning]\n===\nMorning",
          },
        ],
      },
    ];

    const strings = extractTTSStrings(chaptersData, [], false);
    expect(strings.length).toBe(1);
    expect(strings[0]).toBe("早晨");
  });

  test("includes fallback vocab when flag is true", () => {
    const chaptersData: any[] = [];
    const vocabList = [{ character: "早晨", firstIntroducedIn: "01-intro.md" }];

    const strings = extractTTSStrings(chaptersData, vocabList, true);
    expect(strings).toContain("早晨");
  });

  test("extractSpokenTexts parses dialog without speaker", () => {
    const chapterData = [
      {
        id: "test",
        file: "test.md",
        blocks: [{ type: "dialog", content: "   \njust dialog no speaker\n" }],
      },
    ];
    const res = extractTTSStrings(chapterData, [], false);
    expect(res).not.toContain("just dialog no speaker");
  });

  test("extractSpokenTexts gracefully handles missing inline matches", () => {
    const chapterData = [
      {
        id: "test",
        file: "test.md",
        blocks: [{ type: "prose", content: "`broken[" }],
      },
    ];
    const res = extractTTSStrings(chapterData, [], false);
    expect(res).not.toContain("broken");
  });

  test("extractSpokenTexts handles fallback vocab without character", () => {
    const res = extractTTSStrings(
      [],
      [{ character: "", jyutping: "", translation: "" }] as any,
      true,
    );
    expect(res.length).toBe(0);
  });
});
