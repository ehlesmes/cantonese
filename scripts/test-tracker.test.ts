import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

describe("Vocabulary Tracker E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const contentDir = path.join(projectRoot, "content");
  const jsonPath = path.join(contentDir, "vocabulary.json");
  const mdPath = path.join(contentDir, "vocabulary.md");
  const curriculumPath = path.join(contentDir, "curriculum.md");

  let hasJsonBackup = false;
  let jsonBackup: string | null = null;
  let hasMdBackup = false;
  let mdBackup: string | null = null;
  let hasCurriculumBackup = false;
  let curriculumBackup: string | null = null;

  beforeAll(() => {
    // Backup any existing vocabulary.json / vocabulary.md / curriculum.md
    hasJsonBackup = fs.existsSync(jsonPath);
    if (hasJsonBackup) jsonBackup = fs.readFileSync(jsonPath, "utf8");

    hasMdBackup = fs.existsSync(mdPath);
    if (hasMdBackup) mdBackup = fs.readFileSync(mdPath, "utf8");

    hasCurriculumBackup = fs.existsSync(curriculumPath);
    if (hasCurriculumBackup)
      curriculumBackup = fs.readFileSync(curriculumPath, "utf8");
  });

  afterAll(() => {
    // Restore backups
    if (hasJsonBackup) {
      if (jsonBackup !== null) fs.writeFileSync(jsonPath, jsonBackup, "utf8");
    } else if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }

    if (hasMdBackup) {
      if (mdBackup !== null) fs.writeFileSync(mdPath, mdBackup, "utf8");
    } else if (fs.existsSync(mdPath)) {
      fs.unlinkSync(mdPath);
    }

    if (hasCurriculumBackup) {
      if (curriculumBackup !== null)
        fs.writeFileSync(curriculumPath, curriculumBackup, "utf8");
    }
  });

  test("CLI Script executes and successfully orchestrates I/O", () => {
    // Write temporary test chapter
    const testFile = path.join(contentDir, "test-vocab-e2e.md");
    const content = `---
id: test-vocab-e2e
title: Test Vocab E2E
description: Test.
---

This is an \`E2E[yi6ji6ji6|end to end]\` test.
`;
    fs.writeFileSync(testFile, content, "utf8");

    // Modify curriculum.md
    if (hasCurriculumBackup) {
      const curriculumContent = fs.readFileSync(curriculumPath, "utf8");
      const targetStr = 'pets-vet-slang.md"\n';
      if (curriculumContent.includes(targetStr)) {
        const insertion = `  - id: "test-vocab-e2e"
    title: "Test Vocab E2E"
    file: "test-vocab-e2e.md"
`;
        const updatedCurriculum = curriculumContent.replace(
          targetStr,
          targetStr + insertion,
        );
        fs.writeFileSync(curriculumPath, updatedCurriculum, "utf8");
      }
    }

    try {
      execSync("npx tsx scripts/track-vocabulary.ts", {
        cwd: projectRoot,
        stdio: "pipe",
      });

      // Verify files were generated successfully
      expect(fs.existsSync(jsonPath)).toBe(true);
      expect(fs.existsSync(mdPath)).toBe(true);

      const db = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
        character: string;
      }[];
      const e2eEntry = db.find((item) => item.character === "E2E");
      expect(e2eEntry).toBeDefined();
    } finally {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    }
  });
});
