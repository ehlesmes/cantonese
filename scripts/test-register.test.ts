import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const stripAnsi = (str: string) => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
};

describe("Cantonese Lexicon Registrar CLI E2E Spec", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const tempDir = path.join(projectRoot, "tmp");
  const dictPath = path.join(tempDir, "dictionary-test.json");

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    const seedData = [
      {
        char: "唔該",
        jyutping: "m4goi1",
        definition: "excuse me",
        type: "expression",
      },
    ];
    fs.writeFileSync(dictPath, JSON.stringify(seedData, null, 2), "utf8");
  });

  afterAll(() => {
    if (fs.existsSync(dictPath)) {
      try {
        fs.unlinkSync(dictPath);
      } catch {
        // ignore
      }
    }
  });

  const runRegister = (args: string) => {
    try {
      const rawOutput = execSync(`npx tsx scripts/register-word.ts ${args} 2>&1`, {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: "pipe",
        env: {
          ...process.env,
          DICT_PATH: dictPath,
        },
      });
      return { success: true, output: stripAnsi(rawOutput) };
    } catch (err: any) {
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
    expect(res.output).toContain("Usage (Single Entry):");
  });

  test("Registering a valid new word successfully", () => {
    // Register "腸粉" (coeng2fan2)
    const res = runRegister(
      '腸粉 coeng2fan2 "steamed rice noodle rolls" noun "Common dim sum dish."',
    );
    expect(res.success).toBe(true);
    expect(res.output).toContain("Successfully registered 1 new word(s):");
    expect(res.output).toContain("腸粉 (coeng2fan2) — noun");

    // Read dictionary to verify sorting and inclusion
    const dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    const entry = dictionary.find((e: any) => e.char === "腸粉");
    expect(entry).toBeDefined();
    expect(entry.jyutping).toBe("coeng2fan2");
    expect(entry.definition).toBe("steamed rice noodle rolls");
    expect(entry.type).toBe("noun");
    expect(entry.notes).toBe("Common dim sum dish.");
  });

  test("Reject registering with an invalid Jyutping tone format", () => {
    const res = runRegister('腸粉 coeng2fan "steamed rice noodle rolls" noun');
    expect(res.success).toBe(false);
    expect(res.output).toContain("Invalid Jyutping format");
  });

  test("Reject registering with an invalid word type", () => {
    const res = runRegister(
      '腸粉 coeng2fan2 "steamed rice noodle rolls" invalidtype',
    );
    expect(res.success).toBe(false);
    expect(res.output).toContain('Invalid word type "invalidtype"');
    expect(res.output).toContain("Valid types are:");
  });

  test("Reject duplicate registration of character and jyutping", () => {
    // "唔該" (m4goi1) is already in the dictionary
    const res = runRegister('唔該 m4goi1 "excuse me" expression');
    expect(res.success).toBe(false);
    expect(res.output).toContain("already registered in the dictionary");
  });

  test("Register multiple valid words via --json", () => {
    const payload = JSON.stringify([
      {
        char: "芝士",
        jyutping: "zi1si2",
        definition: "cheese",
        type: "noun",
        notes: "Dairy food.",
      },
      {
        char: "紅豆冰",
        jyutping: "hung4dau2bing1",
        definition: "red bean ice",
        type: "noun",
      },
    ]);
    const escapedPayload = payload.replace(/'/g, "'\\''");
    const res = runRegister(`--json '${escapedPayload}'`);
    expect(res.success).toBe(true);
    expect(res.output).toContain("Successfully registered 2 new word(s)");
    expect(res.output).toContain("芝士 (zi1si2) — noun");
    expect(res.output).toContain("紅豆冰 (hung4dau2bing1) — noun");

    const dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    const entry1 = dictionary.find((e: any) => e.char === "芝士");
    const entry2 = dictionary.find((e: any) => e.char === "紅豆冰");
    expect(entry1).toBeDefined();
    expect(entry1.jyutping).toBe("zi1si2");
    expect(entry2).toBeDefined();
    expect(entry2.jyutping).toBe("hung4dau2bing1");
  });

  test("Register multiple valid words via --file", () => {
    const tempFilePath = path.join(projectRoot, "content/temp-batch-test.json");
    const payload = [
      {
        char: "蝦餃",
        jyutping: "haa1gaau2",
        definition: "shrimp dumplings",
        type: "noun",
      },
      {
        char: "春卷",
        jyutping: "ceon1gyun2",
        definition: "spring rolls",
        type: "noun",
      },
    ];
    fs.writeFileSync(tempFilePath, JSON.stringify(payload, null, 2), "utf8");

    try {
      const res = runRegister(`--file content/temp-batch-test.json`);
      expect(res.success).toBe(true);
      expect(res.output).toContain("Successfully registered 2 new word(s)");
      expect(res.output).toContain("蝦餃 (haa1gaau2) — noun");
      expect(res.output).toContain("春卷 (ceon1gyun2) — noun");

      const dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
      const entry1 = dictionary.find((e: any) => e.char === "蝦餃");
      const entry2 = dictionary.find((e: any) => e.char === "春卷");
      expect(entry1).toBeDefined();
      expect(entry1.jyutping).toBe("haa1gaau2");
      expect(entry2).toBeDefined();
      expect(entry2.jyutping).toBe("ceon1gyun2");
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  test("Reject batch with mixed valid and invalid entries (transactional rollback)", () => {
    let dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    expect(dictionary.find((e: any) => e.char === "咖喱角")).toBeUndefined();

    const payload = [
      {
        char: "咖喱角",
        jyutping: "gaa1lei1gok3",
        definition: "curry puff",
        type: "noun",
      },
      {
        char: "馬拉糕",
        jyutping: "maa5laai1gou",
        definition: "sponge cake",
        type: "noun",
      },
    ];
    const escapedPayload = JSON.stringify(payload).replace(/'/g, "'\\''");
    const res = runRegister(`--json '${escapedPayload}'`);

    expect(res.success).toBe(false);
    expect(res.output).toContain("ERROR: Batch registration failed");
    expect(res.output).toContain("maa5laai1gou");

    dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    expect(dictionary.find((e: any) => e.char === "咖喱角")).toBeUndefined();
    expect(dictionary.find((e: any) => e.char === "馬拉糕")).toBeUndefined();
  });

  test("Reject batch containing duplicate entries within itself", () => {
    const payload = [
      {
        char: "糯米雞",
        jyutping: "no6mai5gai1",
        definition: "sticky rice dumpling",
        type: "noun",
      },
      {
        char: "糯米雞",
        jyutping: "no6mai5gai1",
        definition: "lo mai gai",
        type: "noun",
      },
    ];
    const escapedPayload = JSON.stringify(payload).replace(/'/g, "'\\''");
    const res = runRegister(`--json '${escapedPayload}'`);

    expect(res.success).toBe(false);
    expect(res.output).toContain(
      'Duplicate entry for "糯米雞" with Jyutping "no6mai5gai1" found within the batch itself.',
    );

    const dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    expect(dictionary.find((e: any) => e.char === "糯米雞")).toBeUndefined();
  });
});

export {};
