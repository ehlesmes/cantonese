import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { runVerification } from "./verify-chapter-vocab";

describe("Cantonese Chapter Vocabulary Checker E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const tempContentDir = path.join(projectRoot, "tmp/test-content");
  const tempChapterPath = path.join(
    tempContentDir,
    "99-test-checker-chapter.md",
  );
  const tempDictPath = path.join(projectRoot, "tmp/test-dictionary.json");

  beforeAll(() => {
    // Ensure tmp directories exist
    const tmpDir = path.join(projectRoot, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    if (!fs.existsSync(tempContentDir))
      fs.mkdirSync(tempContentDir, { recursive: true });

    // Write a fully sandboxed mock dictionary
    const mockDict = [
      {
        char: "唔該",
        jyutping: "m4goi1",
        definition: "excuse me / please / thank you",
        type: "expression",
      },
      { char: "我", jyutping: "ngo5", definition: "I / me", type: "pronoun" },
      {
        char: "想",
        jyutping: "soeng2",
        definition: "want to / would like to",
        type: "auxiliary verb",
      },
      { char: "食", jyutping: "sik6", definition: "to eat", type: "verb" },
      {
        char: "點心",
        jyutping: "dim2sam1",
        definition: "dim sum",
        type: "noun",
      },
    ];
    fs.writeFileSync(tempDictPath, JSON.stringify(mockDict, null, 2), "utf8");
  });

  afterAll(() => {
    if (fs.existsSync(tempChapterPath)) fs.unlinkSync(tempChapterPath);
    if (fs.existsSync(tempDictPath)) fs.unlinkSync(tempDictPath);
    if (fs.existsSync(tempContentDir))
      fs.rmSync(tempContentDir, { recursive: true, force: true });
  });

  const runChecker = (chapterFile: string) => {
    try {
      const res = runVerification({
        contentDir: tempContentDir,
        targetFile: chapterFile,
        dictPath: tempDictPath,
      });
      // Flatten errors into output strings to simulate the CLI output expectations of the tests
      let errorString = "";
      let warningString = "";

      const errorFiles = Object.keys(res.errors);
      if (errorFiles.length > 0) {
        errorString += `Found ${Object.values(res.errors).flat().length} unregistered vocabulary error(s)\n`;
        errorFiles.forEach((file) => {
          res.errors[file]?.forEach((err: any) => {
            errorString += `${err.term}\nnot registered in the dictionary\n`;
          });
        });
      }

      const warningFiles = Object.keys(res.warnings);
      if (warningFiles.length > 0) {
        warningString += `Found ${Object.values(res.warnings).flat().length} translation divergence warning(s)\n`;
        warningFiles.forEach((file) => {
          res.warnings[file]?.forEach((warn: any) => {
            warningString += `${warn.term}\nTranslation divergence\n`;
          });
        });
      }

      return {
        success: Object.keys(res.errors).length === 0,
        output:
          "Checking vocabulary consistency in chapter\n" +
          (res.passedCount > 0
            ? "perfectly match the master local dictionary\n"
            : "") +
          errorString +
          warningString,
        raw: res,
      };
    } catch (err: any) {
      return {
        success: false,
        output: err instanceof Error ? err.message : String(err),
      };
    }
  };

  test("Verify a perfectly consistent chapter file (100% dictionary match)", () => {
    const content = `---
chapter: 99
title: Consistent Test
description: Testing consistency checker.
---

Let's test \`唔該[m4goi1|excuse me]\` in prose.

\`\`\`cantonese
我[ngo5|I]想[soeng2|want to]食[sik6|to eat]點心[dim2sam1|dim sum]。
===
I want to eat dim sum.
\`\`\`
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker(tempChapterPath);
    expect(res.success).toBe(true);
    expect(res.output).toContain("perfectly match the master local dictionary");
  });

  test("Catch an unregistered vocabulary term", () => {
    const content = `---
chapter: 99
title: Unregistered Test
description: Testing consistency checker.
---

Let's test unregistered word \`腸粉[coeng2fan2|steamed rice rolls]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker(tempChapterPath);
    expect(res.success).toBe(false);
    expect(res.output).toContain("Found 1 unregistered vocabulary error(s)");
    expect(res.output).toContain("腸粉 (coeng2fan2)");
    expect(res.output).toContain("not registered in the dictionary");
  });

  test("Catch a translation divergence warning", () => {
    const content = `---
chapter: 99
title: Mismatch Test
description: Testing consistency checker.
---

Let's test translation mismatch \`唔該[m4goi1|plain white rice]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker(tempChapterPath);
    expect(res.success).toBe(true);
    expect(res.output).toContain("Found 1 translation divergence warning(s)");
    expect(res.output).toContain("唔該 (m4goi1)");
    expect(res.output).toContain("Translation divergence");
  });

  test("Verify a dynamic A-not-A question form", () => {
    const content = `---
chapter: 99
title: Dynamic A-not-A Test
description: Testing dynamic A-not-A question form validation.
---

Let's test \`食唔食[sik6 m4 sik6|eat or not?]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker(tempChapterPath);
    expect(res.success).toBe(true);
    expect(res.output).toContain("perfectly match the master local dictionary");
  });

  test("Fail a dynamic A-not-A question form where the base verb is not in the dictionary", () => {
    const content = `---
chapter: 99
title: Invalid A-not-A Test
description: Testing dynamic A-not-A failure.
---

Let's test invalid \`豬唔豬[zyu1 m4 zyu1|pig or not]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker(tempChapterPath);
    expect(res.success).toBe(false);
    expect(res.output).toContain("Found 1 unregistered vocabulary error(s)");
    expect(res.output).toContain("豬唔豬 (zyu1 m4 zyu1)");
    expect(res.output).toContain("not registered in the dictionary");
  });

  test("Verify All Mode processes multiple files", () => {
    if (fs.existsSync(tempChapterPath)) {
      fs.unlinkSync(tempChapterPath);
    }
    const file1 = path.join(tempContentDir, "test1.md");
    const file2 = path.join(tempContentDir, "test2.md");
    fs.writeFileSync(
      file1,
      "---\nid: test1\n---\n\nLet's test `我[ngo5|I]` in prose.",
      "utf8",
    );
    fs.writeFileSync(
      file2,
      "---\nid: test2\n---\n\nLet's test `想[soeng2|want to]` in prose.",
      "utf8",
    );

    const res = runVerification({
      contentDir: tempContentDir,
      targetFile: undefined,
      dictPath: tempDictPath,
    });

    expect(Object.keys(res.errors).length).toBe(0);
    expect(res.passedCount).toBe(2);

    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
  });

  test("Throw error in All Mode if content directory does not exist", () => {
    expect(() => {
      runVerification({
        contentDir: path.join(projectRoot, "tmp/does-not-exist-dir"),
        targetFile: undefined,
        dictPath: tempDictPath,
      });
    }).toThrow("Content directory not found");
  });
});

export {};
