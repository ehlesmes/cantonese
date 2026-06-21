import { describe, test, expect } from "vitest";
import fs from "fs";
import path from "path";
import parser from "./lib/parser";
import validator from "./validate-format";

describe("Chapter Format & Curriculum Validator Spec", () => {
  // ==========================================
  // 1. YAML Parser Tests
  // ==========================================
  test("YAML - Flat keys parsing", () => {
    const yaml = `
chapter: 1
title: Greetings & Courtesy
description: Learn greetings.
`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.chapter).toBe(1);
    expect(parsed.title).toBe("Greetings & Courtesy");
    expect(parsed.description).toBe("Learn greetings.");
  });

  test("YAML - Multiline block parsing with |", () => {
    const yaml = `
question: |
  Fill in the blank:
  我想 ____ 點心。
answer: 食
`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.question).toBe("Fill in the blank:\n我想 ____ 點心。");
    expect(parsed.answer).toBe("食");
  });

  test("YAML - Array of objects parsing", () => {
    const yaml = `
chapters:
  - chapter: 0
    title: "Intro"
    file: "00-intro.md"
  - chapter: 1
    title: "Greetings"
    file: "01-greetings.md"
`;
    const parsed = parser.parseYAML(yaml);
    expect(Array.isArray(parsed.chapters)).toBe(true);
    expect(parsed.chapters).toHaveLength(2);
    expect(parsed.chapters[0].chapter).toBe(0);
    expect(parsed.chapters[0].title).toBe("Intro");
    expect(parsed.chapters[0].file).toBe("00-intro.md");
    expect(parsed.chapters[1].chapter).toBe(1);
    expect(parsed.chapters[1].file).toBe("01-greetings.md");
  });

  // ==========================================
  // 2. Jyutping Validation Tests
  // ==========================================
  test("Jyutping - Valid cases", () => {
    expect(validator.validateJyutping("nei5hou2")).toBeNull();
    expect(validator.validateJyutping("m4goi1")).toBeNull();
    expect(validator.validateJyutping("m4sai2 haak3hei3")).toBeNull();
    expect(validator.validateJyutping("ng5")).toBeNull();
    expect(validator.validateJyutping("saam1sap6-man1")).toBeNull(); // hyphenated compound
  });

  test("Jyutping - Invalid cases", () => {
    expect(validator.validateJyutping("nei5hou")).toBeTruthy(); // missing tone digit
    expect(validator.validateJyutping("nei5hou27")).toBeTruthy(); // multiple digits/invalid
    expect(validator.validateJyutping("NEI5hou2")).toBeTruthy(); // uppercase letter
    expect(validator.validateJyutping("nei5hou2 ")).toBeTruthy(); // trailing space caught
  });

  // ==========================================
  // 3. Semantic Unit Extraction Tests
  // ==========================================
  test("Extraction - Inline semantic units", () => {
    const text =
      "The basic greeting is `你好[nei5hou2|hello]`, and `唔該[m4goi1|excuse me]`.";
    const units = parser.extractInlineUnits(text);
    expect(units).toHaveLength(2);
    expect(units[0].characters).toBe("你好");
    expect(units[0].jyutping).toBe("nei5hou2");
    expect(units[0].translation).toBe("hello");
    expect(units[1].characters).toBe("唔該");
    expect(units[1].jyutping).toBe("m4goi1");
    expect(units[1].translation).toBe("excuse me");
  });

  test("Extraction - Block semantic units", () => {
    const text = "唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want]買。";
    const units = parser.extractBlockUnits(text);
    expect(units).toHaveLength(3);
    expect(units[0].characters).toBe("唔該");
    expect(units[0].jyutping).toBe("m4goi1");
    expect(units[1].characters).toBe("我");
    expect(units[1].jyutping).toBe("ngo5");
    expect(units[2].characters).toBe("想");
    expect(units[2].jyutping).toBe("soeng2");
  });

  // ==========================================
  // 4. E2E File Parsing & Validation Tests
  // ==========================================
  test("E2E Chapter Validation - Valid Chapter", () => {
    const tempDir = path.join(__dirname, "tmp_test");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const validFile = path.join(tempDir, "01-valid.md");

    const validContent = `---
chapter: 1
title: Greetings & Courtesy
description: Learn daily greetings.
---

# Greetings

The basic greeting is \`你好[nei5hou2|hello]\` in Cantonese.

\`\`\`cantonese
唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want to]買[maai5|buy]呢個[ni1go3|this one]。
===
Excuse me, I want to buy this one.
\`\`\`

\`\`\`dialog
A: 唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want to]買[maai5|buy]呢個[ni1go3|this one]。
   === Excuse me, I want to buy this one.
B: 好啊[hou2aa3|sure]，呢個[ni1go3|this one]三十[saam1sap6|thirty]蚊[man1|dollars]。
   === Sure, this one is thirty dollars.
\`\`\`

\`\`\`exercise
question: |
  Which of the following is the most natural way to say "Thank you" when someone gives you a gift?
  A) 唔該[m4goi1|excuse me / thank you for service]
  B) 多謝[do1ze6|thank you for a gift]
answer: B
explanation: 多謝[do1ze6|thank you for a gift] is used for gifts.
\`\`\`
`;
    fs.writeFileSync(validFile, validContent, "utf8");

    const curriculumEntry = {
      chapter: 1,
      title: "Greetings & Courtesy",
      file: "01-valid.md",
    };
    const errors = validator.validateChapterFile(validFile, curriculumEntry);

    // Clean up
    fs.unlinkSync(validFile);
    fs.rmdirSync(tempDir);

    expect(errors).toHaveLength(0);
  });

  test("E2E Chapter Validation - Invalid Chapter File", () => {
    const tempDir = path.join(__dirname, "tmp_test_invalid");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const invalidFile = path.join(tempDir, "02-invalid.md");

    const invalidContent = `---
chapter: 3
title: Incorrect Chapter Num
description: This description is okay.
---

# Incorrect Chapter Num

We have raw Chinese text here: 你好.
And a malformed inline unit \`你好[nei5hou|missing tone digit]\`.
Here we have double backticks: \`\`食[sik6|eat]\` \`咗[zo2|completed]\` \`嘢食[je5sik6|food]\`\`.

\`\`\`cantonese
唔該[m4goi1|excuse me] 我想[soeng2|want to]買呢個[ni1go3|this one].
===
Excuse me, I want to buy this one.
===
Duplicate separator here!
\`\`\`

\`\`\`dialog
A: 唔該[m4goi1|excuse me]
B: Missing translation immediately after A turn!
\`\`\`

\`\`\`exercise
question: Translate "Excuse me"
answer: 唔該
explanation: Missing block formatting.
\`\`\`
`;
    fs.writeFileSync(invalidFile, invalidContent, "utf8");

    const curriculumEntry = {
      chapter: 2,
      title: "Incorrect Chapter Num",
      file: "02-invalid.md",
    };
    const errors = validator.validateChapterFile(invalidFile, curriculumEntry);

    // Clean up
    fs.unlinkSync(invalidFile);
    fs.rmdirSync(tempDir);

    // Assert exact violations:
    // 1. Chapter number mismatch (frontmatter says 3, filename prefix says 02, curriculum says 2)
    const chapNumError = errors.find(
      (e) =>
        e.message.includes("frontmatter chapter number") ||
        e.message.includes("does not match the filename prefix"),
    );
    expect(chapNumError).toBeDefined();

    // 2. Unannotated Chinese in prose (Line 9: "你好.")
    const rawChineseProse = errors.find(
      (e) =>
        e.line === 9 &&
        e.message.includes('Found unannotated Chinese character "你"'),
    );
    expect(rawChineseProse).toBeDefined();

    // 3. Malformed Jyutping in prose (Line 10: "nei5hou" lacks tone digit)
    const malformedJpProse = errors.find(
      (e) =>
        e.line === 10 &&
        e.message.includes('Invalid Jyutping format "nei5hou"'),
    );
    expect(malformedJpProse).toBeDefined();

    // 3.5. Double/adjacent backticks in prose (Line 11)
    const doubleBacktickErr = errors.find(
      (e) =>
        e.line === 11 &&
        e.message.includes("Found invalid double/adjacent backticks"),
    );
    expect(doubleBacktickErr).toBeDefined();

    // 4. Duplicate/invalid separator count in cantonese block
    const cantoneseSepErr = errors.find((e) =>
      e.message.includes(
        "Cantonese example block must contain exactly one separator line",
      ),
    );
    expect(cantoneseSepErr).toBeDefined();

    // 5. Dialogue block missing correct prefixed translation
    const dialogTransErr = errors.find((e) =>
      e.message.includes(
        'Dialogue translation line must be prefixed with exactly "=== "',
      ),
    );
    expect(dialogTransErr).toBeDefined();

    // 6. Exercise block unannotated Chinese character
    const exerciseChineseErr = errors.find((e) =>
      e.message.includes(
        'Found unannotated Chinese character "唔" inside exercise field "answer"',
      ),
    );
    expect(exerciseChineseErr).toBeDefined();
  });
});
