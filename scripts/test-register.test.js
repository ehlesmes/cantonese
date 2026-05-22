import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const stripAnsi = (str) => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
};

describe("Cantonese Lexicon Registrar CLI E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const dictPath = path.join(projectRoot, "content/dictionary.json");

  let hasBackup = false;
  let backupContent = null;

  beforeAll(() => {
    hasBackup = fs.existsSync(dictPath);
    if (hasBackup) {
      backupContent = fs.readFileSync(dictPath, "utf8");
    }
  });

  afterAll(() => {
    if (hasBackup) {
      fs.writeFileSync(dictPath, backupContent, "utf8");
    }
  });

  const runRegister = (args) => {
    try {
      const rawOutput = execSync(`node scripts/register-word.js ${args} 2>&1`, {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: "pipe",
      });
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

  test("Display usage instructions when insufficient arguments are provided", () => {
    const res = runRegister("one two three");
    expect(res.success).toBe(false);
    expect(res.output).toContain("Cantonese Lexicon Dictionary Registrar");
    expect(res.output).toContain("Usage:");
  });

  test("Registering a valid new word successfully", () => {
    // Register "腸粉" (coeng2fan2)
    const res = runRegister(
      '腸粉 coeng2fan2 "steamed rice noodle rolls" noun "Common dim sum dish."',
    );
    expect(res.success).toBe(true);
    expect(res.output).toContain("Successfully registered new word");
    expect(res.output).toContain("腸粉 (coeng2fan2) — noun");

    // Read dictionary to verify sorting and inclusion
    const dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    const entry = dictionary.find((e) => e.char === "腸粉");
    expect(entry).toBeDefined();
    expect(entry.jyutping).toBe("coeng2fan2");
    expect(entry.definition).toBe("steamed rice noodle rolls");
    expect(entry.type).toBe("noun");
    expect(entry.notes).toBe("Common dim sum dish.");
  });

  test("Reject registering with an invalid Jyutping tone format", () => {
    const res = runRegister('腸粉 coeng2fan "steamed rice noodle rolls" noun');
    expect(res.success).toBe(false);
    expect(res.output).toContain("ERROR: Invalid Jyutping format");
  });

  test("Reject registering with an invalid word type", () => {
    const res = runRegister(
      '腸粉 coeng2fan2 "steamed rice noodle rolls" invalidtype',
    );
    expect(res.success).toBe(false);
    expect(res.output).toContain('ERROR: Invalid word type "invalidtype"');
    expect(res.output).toContain("Valid types are:");
  });

  test("Reject duplicate registration of character and jyutping", () => {
    // "唔該" (m4goi1) is already in the dictionary
    const res = runRegister('唔該 m4goi1 "excuse me" expression');
    expect(res.success).toBe(false);
    expect(res.output).toContain("is already registered in the dictionary");
  });
});
