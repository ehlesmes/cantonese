import { describe, test, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

const actualFs = await vi.importActual<typeof import("fs")>("fs");

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    readFileSync: vi
      .fn()
      .mockImplementation((...args: Parameters<typeof fs.readFileSync>) =>
        actual.readFileSync(...args),
      ),
    readdirSync: vi
      .fn()
      .mockImplementation((...args: Parameters<typeof fs.readdirSync>) =>
        actual.readdirSync(...args),
      ),
    statSync: vi
      .fn()
      .mockImplementation((...args: Parameters<typeof fs.statSync>) =>
        actual.statSync(...args),
      ),
  };
});

import * as portability from "./validate-portability";

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
    const err0 = errors[0];
    if (!err0) throw new Error("Expected error to be defined");
    expect(err0.file).toContain("bad-file.md");
    expect(err0.match).toBe(["file:", "", "", ""].join("/"));
  });

  test("runCheck recursively crawls subdirectories", () => {
    const tempDir = path.join(__dirname, "tmp_portability_recursive_test");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const subDir = path.join(tempDir, "subdir");
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir);

    const badFile = path.join(subDir, "bad-nested.md");
    const badContent =
      "Forbidden absolute path: " +
      ["file:", "", "", "Users", "test"].join("/");
    fs.writeFileSync(badFile, badContent, "utf8");

    const errors = portability.runCheck(tempDir);

    // Clean up
    fs.unlinkSync(badFile);
    fs.rmdirSync(subDir);
    fs.rmdirSync(tempDir);

    expect(errors).toHaveLength(1);
    const err1 = errors[0];
    if (!err1) throw new Error("Expected error to be defined");
    expect(err1.file).toContain("bad-nested.md");
  });

  test("runCheck catches file read errors and logs warning", () => {
    const tempDir = path.join(__dirname, "tmp_portability_error_test");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const testFile = path.join(tempDir, "read-error.md");
    fs.writeFileSync(testFile, "Clean contents", "utf8");

    // Spy on readFileSync to throw error for read-error.md
    vi.mocked(fs.readFileSync).mockImplementation((filePath, options) => {
      if (typeof filePath === "string" && filePath.includes("read-error.md")) {
        throw new Error("Simulated permission denied");
      }
      return actualFs.readFileSync(
        filePath as Parameters<typeof actualFs.readFileSync>[0],
        options as Parameters<typeof actualFs.readFileSync>[1],
      );
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const errors = portability.runCheck(tempDir);

    // Clean up
    fs.unlinkSync(testFile);
    fs.rmdirSync(tempDir);

    expect(errors).toHaveLength(0); // Ignored/warned
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Could not read file"),
    );
    vi.restoreAllMocks();
  });

  test("main CLI - success execution path", () => {
    const originalExit = process.exit;
    const originalLog = console.log;

    let exitCode: number | null | string = null;
    vi.spyOn(process, "exit").mockImplementation(
      (code?: string | number | null) => {
        exitCode = code ?? null;
        throw new Error("process.exit");
      },
    );

    vi.spyOn(portability, "runCheck").mockReturnValue([]);

    let logOutput = "";
    console.log = (msg) => {
      logOutput += msg + "\n";
    };

    try {
      portability.main();
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "process.exit") throw e;
    } finally {
      process.exit = originalExit;
      console.log = originalLog;
      vi.restoreAllMocks();
    }

    expect(exitCode).toBe(0);
    expect(logOutput).toContain("Portability check passed successfully");
  });

  test("main CLI - failure execution path on invalid files", () => {
    const originalExit = process.exit;
    const originalError = console.error;

    let exitCode: number | null | string = null;
    vi.spyOn(process, "exit").mockImplementation(
      (code?: string | number | null) => {
        exitCode = code ?? null;
        throw new Error("process.exit");
      },
    );

    // Force readFileSync to return a forbidden path for some mock check
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      return ["mock-portability-bad.md"] as unknown as ReturnType<
        typeof fs.readdirSync
      >;
    });
    vi.mocked(fs.statSync).mockImplementation(() => {
      return { isDirectory: () => false } as unknown as ReturnType<
        typeof fs.statSync
      >;
    });
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      return "Hardcoded: /Us" + "ers/username/absolute";
    });

    let errOutput = "";
    console.error = (msg) => {
      errOutput += msg + "\n";
    };

    try {
      portability.main();
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "process.exit") throw e;
    } finally {
      vi.restoreAllMocks();
      process.exit = originalExit;
      console.error = originalError;
    }

    expect(exitCode).toBe(1);
    expect(errOutput).toContain("Portability Check Failed");
  });
});

export {};
