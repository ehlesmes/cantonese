import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const stripAnsi = (str) => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
};

describe("Cantonese Chapter Vocabulary Checker E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const tempChapterPath = path.join(
    projectRoot,
    "content/99-test-checker-chapter.md",
  );

  const tempDictPath = path.join(projectRoot, "tmp/test-dictionary.json");

  beforeAll(() => {
    // Ensure tmp directory exists
    const tmpDir = path.join(projectRoot, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Write a fully sandboxed mock dictionary
    const mockDict = [
      {
        char: "唔該",
        jyutping: "m4goi1",
        definition: "excuse me / please / thank you",
        type: "expression",
      },
      {
        char: "我",
        jyutping: "ngo5",
        definition: "I / me",
        type: "pronoun",
      },
      {
        char: "想",
        jyutping: "soeng2",
        definition: "want to / would like to",
        type: "auxiliary verb",
      },
      {
        char: "食",
        jyutping: "sik6",
        definition: "to eat",
        type: "verb",
      },
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
    if (fs.existsSync(tempChapterPath)) {
      fs.unlinkSync(tempChapterPath);
    }
    if (fs.existsSync(tempDictPath)) {
      fs.unlinkSync(tempDictPath);
    }
  });

  const runChecker = (chapterFile) => {
    try {
      const rawOutput = execSync(
        `node scripts/verify-chapter-vocab.js ${chapterFile} 2>&1`,
        {
          cwd: projectRoot,
          encoding: "utf8",
          stdio: "pipe",
          env: {
            ...process.env,
            DICT_PATH: tempDictPath,
          },
        },
      );
      return { success: true, output: stripAnsi(rawOutput) };
    } catch (err) {
      const stdout = err.stdout ? err.stdout.toString() : "";
      const stderr = err.stderr ? err.stderr.toString() : "";
      return {
        success: false,
        output: stripAnsi(stdout + "\n" + stderr),
      };
    }
  };

  test("Verify a perfectly consistent chapter file (100% dictionary match)", () => {
    // "唔該" (m4goi1), "我" (ngo5), "想" (soeng2), "食" (sik6), "點心" (dim2sam1) are standard dictionary entries
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

    const res = runChecker("content/99-test-checker-chapter.md");
    expect(res.success).toBe(true);
    expect(res.output).toContain("Checking vocabulary consistency in chapter");
    expect(res.output).toContain("perfectly match the master local dictionary");
  });

  test("Catch an unregistered vocabulary term (exit code 1)", () => {
    // "腸粉" (coeng2fan2) is not in the dictionary backup
    const content = `---
chapter: 99
title: Unregistered Test
description: Testing consistency checker.
---

Let's test unregistered word \`腸粉[coeng2fan2|steamed rice rolls]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker("content/99-test-checker-chapter.md");
    expect(res.success).toBe(false);
    expect(res.output).toContain("Found 1 unregistered vocabulary error(s)");
    expect(res.output).toContain("腸粉 (coeng2fan2)");
    expect(res.output).toContain("not registered in the dictionary");
  });

  test("Catch a translation divergence warning (exit code 0 but warning output)", () => {
    // "唔該" (m4goi1) exists but translation is "plain white rice" which is completely unrelated
    const content = `---
chapter: 99
title: Mismatch Test
description: Testing consistency checker.
---

Let's test translation mismatch \`唔該[m4goi1|plain white rice]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker("content/99-test-checker-chapter.md");
    // Should pass the check (exit 0) because translation divergence is only a warning
    expect(res.success).toBe(true);
    expect(res.output).toContain("Found 1 translation divergence warning(s)");
    expect(res.output).toContain("唔該 (m4goi1)");
    expect(res.output).toContain("Translation divergence");
  });

  test("Verify a dynamic A-not-A question form (e.g. 食唔食) where base verb is in dictionary", () => {
    // "食" (sik6) is in the dictionary, so "食唔食" (sik6 m4 sik6) should pass automatically
    const content = `---
chapter: 99
title: Dynamic A-not-A Test
description: Testing dynamic A-not-A question form validation.
---

Let's test \`食唔食[sik6 m4 sik6|eat or not?]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker("content/99-test-checker-chapter.md");
    expect(res.success).toBe(true);
    expect(res.output).toContain("Checking vocabulary consistency in chapter");
    expect(res.output).toContain("perfectly match the master local dictionary");
  });

  test("Fail a dynamic A-not-A question form where the base verb is not in the dictionary", () => {
    // "豬" (zyu1) is not in the dictionary, so "豬唔豬" should fail
    const content = `---
chapter: 99
title: Invalid A-not-A Test
description: Testing dynamic A-not-A failure.
---

Let's test invalid \`豬唔豬[zyu1 m4 zyu1|pig or not]\` in prose.
`;
    fs.writeFileSync(tempChapterPath, content, "utf8");

    const res = runChecker("content/99-test-checker-chapter.md");
    expect(res.success).toBe(false);
    expect(res.output).toContain("Found 1 unregistered vocabulary error(s)");
    expect(res.output).toContain("豬唔豬 (zyu1 m4 zyu1)");
    expect(res.output).toContain("not registered in the dictionary");
  });
});
