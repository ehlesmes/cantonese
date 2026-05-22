import { describe, test, expect } from "vitest";
import fs from "fs";
import path from "path";
import portability from "./validate-portability";

describe("Project Portability Validator Spec", () => {
  test("FORBIDDEN_PATTERN matches typical absolute paths", () => {
    // Dynamically construct path strings to avoid triggering the raw file scanner
    const testFileUri = ["file:", "", "", "Users", "edwardlesmes"].join("/");
    const testUsersPath =
      "Referencing " + ["", "Users", "username", "Projects"].join("/");
    const testHomePath = ["", "home", "ubuntu", "course"].join("/");

    expect(portability.FORBIDDEN_PATTERN.test(testFileUri)).toBe(true);
    expect(portability.FORBIDDEN_PATTERN.test(testUsersPath)).toBe(true);
    expect(portability.FORBIDDEN_PATTERN.test(testHomePath)).toBe(true);
    expect(
      portability.FORBIDDEN_PATTERN.test(
        "Relative path scripts/prompts/README.md",
      ),
    ).toBe(false);
  });

  test("runCheck detects forbidden paths inside files", () => {
    const tempDir = path.join(__dirname, "tmp_portability_test");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const badFile = path.join(tempDir, "bad-file.md");
    // Dynamically construct to avoid raw file scan hit
    const badContent =
      "This is a hardcoded " +
      ["file:", "", "", "Users", "test"].join("/") +
      " absolute URL.";
    fs.writeFileSync(badFile, badContent, "utf8");

    const goodFile = path.join(tempDir, "good-file.md");
    fs.writeFileSync(
      goodFile,
      "This has no absolute paths. Only relative ./implement-chapter.md links.",
      "utf8",
    );

    const errors = portability.runCheck(tempDir);

    // Clean up
    fs.unlinkSync(badFile);
    fs.unlinkSync(goodFile);
    fs.rmdirSync(tempDir);

    expect(errors).toHaveLength(1);
    expect(errors[0].file).toContain("bad-file.md");
    expect(errors[0].match).toBe(["file:", "", "", ""].join("/"));
  });
});
