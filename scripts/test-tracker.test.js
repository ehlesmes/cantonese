import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

describe("Vocabulary Tracker E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const contentDir = path.join(projectRoot, "content");
  const jsonPath = path.join(contentDir, "vocabulary.json");
  const mdPath = path.join(contentDir, "vocabulary.md");

  let hasJsonBackup = false;
  let jsonBackup = null;
  let hasMdBackup = false;
  let mdBackup = null;

  beforeAll(() => {
    // Backup any existing vocabulary.json / vocabulary.md
    hasJsonBackup = fs.existsSync(jsonPath);
    if (hasJsonBackup) jsonBackup = fs.readFileSync(jsonPath, "utf8");

    hasMdBackup = fs.existsSync(mdPath);
    if (hasMdBackup) mdBackup = fs.readFileSync(mdPath, "utf8");
  });

  afterAll(() => {
    // Restore backups
    if (hasJsonBackup) {
      fs.writeFileSync(jsonPath, jsonBackup, "utf8");
    } else if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }

    if (hasMdBackup) {
      fs.writeFileSync(mdPath, mdBackup, "utf8");
    } else if (fs.existsSync(mdPath)) {
      fs.unlinkSync(mdPath);
    }
  });

  test("E2E Vocabulary Tracking - Homographs & Chronological First Introductions", () => {
    // Write temporary test chapters with numbers 98 and 99
    const testFile1 = path.join(contentDir, "98-test-vocab-one.md");
    const testFile2 = path.join(contentDir, "99-test-vocab-two.md");

    const content1 = `---
chapter: 98
title: Test Vocab One
description: Test.
---

This is a \`你好[nei5hou2|hello]\` test.
We also test \`行[hang4|to walk]\`.
`;

    const content2 = `---
chapter: 99
title: Test Vocab Two
description: Test.
---

We repeat \`你好[nei5hou2|hi / hello]\`.
And test homograph \`行[hong4|firm/industry]\`.
`;

    fs.writeFileSync(testFile1, content1, "utf8");
    fs.writeFileSync(testFile2, content2, "utf8");

    // Run track-vocabulary.js via node command
    try {
      execSync("node scripts/track-vocabulary.js", {
        cwd: projectRoot,
        stdio: "pipe",
      });
    } catch (err) {
      // Clean up before failing
      if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1);
      if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2);
      throw new Error(`Failed to execute track-vocabulary.js: ${err.message}`);
    }

    try {
      // Read the generated JSON database
      expect(fs.existsSync(jsonPath)).toBe(true);
      const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

      // Filter out any other vocabulary if the repo currently has other files
      const testEntries = db.filter(
        (item) =>
          item.firstIntroducedIn === "98-test-vocab-one.md" ||
          item.firstIntroducedIn === "99-test-vocab-two.md",
      );

      // 1. We should have 3 entries (homographs of "行" must be separate)
      expect(testEntries).toHaveLength(3);

      // 2. Homograph hang4 check
      const hang4 = testEntries.find(
        (item) => item.character === "行" && item.jyutping === "hang4",
      );
      expect(hang4).toBeDefined();
      expect(hang4.translation).toBe("to walk");
      expect(hang4.firstIntroducedIn).toBe("98-test-vocab-one.md");
      expect(hang4.occurrences).toBe(1);

      // 3. Homograph hong4 check
      const hong4 = testEntries.find(
        (item) => item.character === "行" && item.jyutping === "hong4",
      );
      expect(hong4).toBeDefined();
      expect(hong4.translation).toBe("firm/industry");
      expect(hong4.firstIntroducedIn).toBe("99-test-vocab-two.md");
      expect(hong4.occurrences).toBe(1);

      // 4. "你好" check (should merge translation nuances and register first introduced file)
      const hello = testEntries.find((item) => item.character === "你好");
      expect(hello).toBeDefined();
      expect(hello.firstIntroducedIn).toBe("98-test-vocab-one.md");
      expect(hello.occurrences).toBe(2);
      expect(hello.translation).toContain("hello");
      expect(hello.translation).toContain("hi");
    } finally {
      // Always Clean up temporary files
      if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1);
      if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2);
    }
  });
});
