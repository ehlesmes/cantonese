import { describe, test, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const parser = require("./lib/parser");
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

  test("YAML - Multiline block at the very end of YAML string", () => {
    const yaml = `
chapters:
  - chapter: 1
    description: |
      This is a description
      on multiple lines.`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.chapters[0].description).toBe(
      "This is a description\non multiple lines.",
    );
  });

  test("YAML - Flat multiline block at the very end of YAML string", () => {
    const yaml = `
title: Greetings
description: |
  Line 1
  Line 2`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.description).toBe("Line 1\nLine 2");
  });

  test("YAML - Array of objects with last item ending in multiline block", () => {
    const yaml = `
chapters:
  - chapter: 1
    title: Basics
  - chapter: 2
    question: |
      Double line
      question`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.chapters[1].question).toBe("Double line\nquestion");
  });

  test("YAML - Multiline block with empty line followed by subsequent key in object", () => {
    const yaml = `
chapters:
  - chapter: 1
    description: |
      First line
      
      Third line
    title: Basics`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.chapters[0].description).toBe("First line\n\nThird line");
    expect(parsed.chapters[0].title).toBe("Basics");
  });

  test("YAML - Quoted values parsing", () => {
    const yaml = `
key1: "value1 with double quotes"
key2: 'value2 with single quotes'
`;
    const parsed = parser.parseYAML(yaml);
    expect(parsed.key1).toBe("value1 with double quotes");
    expect(parsed.key2).toBe("value2 with single quotes");
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
id: 01-valid
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
      id: "01-valid",
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
id: mismatched-id
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
      id: "02-invalid",
      title: "Incorrect Chapter Num",
      file: "02-invalid.md",
    };
    const errors = validator.validateChapterFile(invalidFile, curriculumEntry);

    // Clean up
    fs.unlinkSync(invalidFile);
    fs.rmdirSync(tempDir);

    // Assert exact violations:
    // 1. Chapter ID mismatch (frontmatter says mismatched-id, filename slug says 02-invalid)
    const chapNumError = errors.find((e) =>
      e.message.includes("does not match the filename slug"),
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

test("Validation - Frontmatter error conditions", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-fm-"));
  const testFile = path.join(tempDir, "05-frontmatter.md");

  // 1. Missing ID
  fs.writeFileSync(
    testFile,
    "---\ntitle: Title\ndescription: Desc\n---\n",
    "utf8",
  );
  let errors = validator.validateChapterFile(testFile);
  expect(
    errors.some((e) => e.message.includes('missing required key "id"')),
  ).toBe(true);

  // 2. ID is not a string
  fs.writeFileSync(
    testFile,
    "---\nid: 123\ntitle: Title\ndescription: Desc\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile);
  expect(errors.some((e) => e.message.includes("value must be a string"))).toBe(
    true,
  );

  // 3. Missing title
  fs.writeFileSync(
    testFile,
    "---\nid: 05-frontmatter\ndescription: Desc\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile);
  expect(
    errors.some((e) => e.message.includes('missing required key "title"')),
  ).toBe(true);

  // 4. Title is not a string
  fs.writeFileSync(
    testFile,
    "---\nid: 05-frontmatter\ntitle: 123\ndescription: Desc\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile);
  expect(
    errors.some((e) => e.message.includes('"title" must be a string')),
  ).toBe(true);

  // 5. Missing description
  fs.writeFileSync(
    testFile,
    "---\nid: 05-frontmatter\ntitle: Title\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile);
  expect(
    errors.some((e) =>
      e.message.includes('missing required key "description"'),
    ),
  ).toBe(true);

  // 6. Description is not a string
  fs.writeFileSync(
    testFile,
    "---\nid: 05-frontmatter\ntitle: Title\ndescription: 123\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile);
  expect(
    errors.some((e) => e.message.includes('"description" must be a string')),
  ).toBe(true);

  // 7. Curriculum entry mismatch
  fs.writeFileSync(
    testFile,
    "---\nid: mismatch-id\ntitle: Title\ndescription: Desc\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile, {
    id: "expected-id",
    title: "Title",
    file: "05-frontmatter.md",
  });
  expect(
    errors.some((e) =>
      e.message.includes("does not match the curriculum definition"),
    ),
  ).toBe(true);

  // 8. Curriculum title mismatch
  fs.writeFileSync(
    testFile,
    "---\nid: expected-id\ntitle: Mismatched Title\ndescription: Desc\n---\n",
    "utf8",
  );
  errors = validator.validateChapterFile(testFile, {
    id: "expected-id",
    title: "Expected Title",
    file: "05-frontmatter.md",
  });
  expect(
    errors.some((e) =>
      e.message.includes("does not match the curriculum title"),
    ),
  ).toBe(true);

  // Clean up
  fs.unlinkSync(testFile);
  fs.rmdirSync(tempDir);
});

test("Validation - Missing YAML block handles error", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-"));
  const invalidFile = path.join(tempDir, "03-missing.md");

  // Create a markdown file with NO YAML block
  const brokenMd = `# Content
Just some text without frontmatter.`;

  fs.writeFileSync(invalidFile, brokenMd, "utf8");

  const errors = validator.validateChapterFile(invalidFile, {
    chapter: 3,
    id: "missing",
    title: "Missing",
    file: "03-missing.md",
  });

  fs.unlinkSync(invalidFile);
  fs.rmdirSync(tempDir);

  const yamlErr = errors.find((e) =>
    e.message.includes("Missing YAML frontmatter block"),
  );
  expect(yamlErr).toBeDefined();
});

test("Jyutping - Invalid tone 7", () => {
  expect(validator.validateJyutping("nei7")).toBeTruthy();
});

test("Jyutping - Punctuation inside jyutping", () => {
  expect(validator.validateJyutping("nei5,hou2")).toBeTruthy();
  expect(validator.validateJyutping("nei5-hou2-!")).toBeTruthy();
});

test("Curriculum Parsing - parses curriculum.md correctly", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-curr-"));
  const currFile = path.join(tempDir, "curriculum.md");

  const currMd = `---
chapters:
  - chapter: 0
    title: Intro
    file: 00-intro.md
  - chapter: 1
    title: Basics
    file: 01-basics.md
---
# Course`;

  fs.writeFileSync(currFile, currMd, "utf8");

  const chapters = parser.parseCurriculum(currFile);
  expect(chapters).toHaveLength(2);
  expect(chapters[0].chapter).toBe(0);
  expect(chapters[1].file).toBe("01-basics.md");

  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
});

test("Curriculum Parsing - parses real curriculum.md", () => {
  const chapters = parser.parseCurriculum(
    path.resolve("content/curriculum.md"),
  );
  expect(chapters.length).toBeGreaterThan(0);
  expect(chapters[0].id).toBeDefined();
});

test("Parser - parseChapter directly covers all block types including other", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-parser-"));
  const tempFile = path.join(tempDir, "05-parser-test.md");

  const mdContent = `---
chapter: 5
title: Parser Direct Test
---
# Welcome
\`\`\`cantonese
你好[nei5hou2|hello]
\`\`\`
\`\`\`dialog
A: 你好
=== Hello
\`\`\`
\`\`\`exercise
question: Test
answer: Answer
explanation: Explain
\`\`\`
\`\`\`python
print("Hello other")
\`\`\`
`;
  fs.writeFileSync(tempFile, mdContent, "utf8");
  const data = parser.parseChapter(tempFile);
  expect(data.frontmatter.chapter).toBe(5);
  // Find the 'other' python block
  const pythonBlock = data.blocks.find((b) => b.type === "other");
  expect(pythonBlock).toBeDefined();
  expect(pythonBlock.content).toContain('print("Hello other")');

  fs.unlinkSync(tempFile);
  fs.rmdirSync(tempDir);
});

test("Validation - reject other code block types", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-other-"));
  const invalidFile = path.join(tempDir, "04-other.md");

  const otherMd = `---
chapter: 4
title: Other Block
description: Test other code blocks.
---
# Content
\`\`\`javascript
console.log('hello');
\`\`\`
`;
  fs.writeFileSync(invalidFile, otherMd, "utf8");
  const errors = validator.validateChapterFile(invalidFile, {
    chapter: 4,
    id: "other",
    title: "Other Block",
    file: "04-other.md",
  });
  fs.unlinkSync(invalidFile);
  fs.rmdirSync(tempDir);

  const otherErr = errors.find((e) =>
    e.message.includes('Unsupported code block type "other"'),
  );
  expect(otherErr).toBeDefined();
});

test("Curriculum Parsing - handles missing frontmatter boundary gracefully", () => {
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), "test-temp-curr-missing-"),
  );
  const currFile = path.join(tempDir, "curriculum.md");

  const currMd = `
chapters:
  - chapter: 0
    title: Intro
    file: 00-intro.md
`;

  fs.writeFileSync(currFile, currMd, "utf8");

  const chapters = parser.parseCurriculum(currFile);
  expect(chapters).toEqual([]);

  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
});

test("Curriculum Parsing - handles unclosed frontmatter boundary gracefully", () => {
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), "test-temp-curr-unclosed-"),
  );
  const currFile = path.join(tempDir, "curriculum.md");

  const currMd = `---
chapters:
  - chapter: 0
    title: Intro
    file: 00-intro.md
`;

  fs.writeFileSync(currFile, currMd, "utf8");

  const chapters = parser.parseCurriculum(currFile);
  expect(chapters).toEqual([]);

  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
});

test("runValidation - handles missing content directory", () => {
  const res = validator.runValidation({
    projectRoot: process.cwd(),
    contentDir: "./nonexistent-content-dir",
    curriculumPath: "./nonexistent-content-dir/curriculum.md",
  });
  expect(res.errors).toHaveLength(1);
  expect(res.errors[0].message).toContain("Content directory not found");
});

test("runValidation - handles missing single file mode file", () => {
  const res = validator.runValidation({
    projectRoot: process.cwd(),
    curriculumPath: "./content/curriculum.md",
    targetFile: "./nonexistent-file.md",
  });
  expect(res.errors).toHaveLength(1);
  expect(res.errors[0].message).toContain("File not found");
});

test("runValidation - detects unregistered chapter file (orphan)", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-val-"));
  const currFile = path.join(tempDir, "curriculum.md");
  // Write empty curriculum
  fs.writeFileSync(currFile, "---\nchapters:\n---\n", "utf8");

  // Write an orphan chapter (match slug and ID to prevent validation errors)
  const orphanFile = path.join(tempDir, "orphan.md");
  fs.writeFileSync(
    orphanFile,
    "---\nid: orphan\ntitle: Orphan\ndescription: test\n---\n",
    "utf8",
  );

  const res = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  fs.unlinkSync(orphanFile);
  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);

  expect(res.errors).toHaveLength(1);
  expect(res.errors[0].message).toContain("exists but is not registered");
});

test("runValidation - detects vocabulary word count thresholds (warning vs error)", () => {
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), "test-temp-vocab-limit-"),
  );
  const currFile = path.join(tempDir, "curriculum.md");

  // 1. Test Warning (>20 words, <=25 words)
  // We will generate 22 unique words in prose (wrap in backticks for prose validation)
  let warningWords = "";
  for (let i = 1; i <= 22; i++) {
    warningWords += `\`字${i}[zi6|word${i}]\` `;
  }

  const currMdWarning = `---
chapters:
  - id: warn
    title: Warning Chapter
    file: warn.md
---
`;
  fs.writeFileSync(currFile, currMdWarning, "utf8");
  const warnFile = path.join(tempDir, "warn.md");
  fs.writeFileSync(
    warnFile,
    `---\nid: warn\ntitle: Warning Chapter\ndescription: Test warning\n---\n${warningWords}`,
    "utf8",
  );

  const resWarning = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  expect(resWarning.errors).toHaveLength(0);
  expect(resWarning.warnings).toHaveLength(1);
  expect(resWarning.warnings[0].chapterId).toBe("warn");
  expect(resWarning.warnings[0].count).toBe(22);

  fs.unlinkSync(warnFile);

  // 2. Test Error (>25 words)
  // Generate 27 unique words in prose (wrap in backticks for prose validation)
  let errorWords = "";
  for (let i = 1; i <= 27; i++) {
    errorWords += `\`字${i}[zi6|word${i}]\` `;
  }

  const currMdError = `---
chapters:
  - id: err
    title: Error Chapter
    file: err.md
---
`;
  fs.writeFileSync(currFile, currMdError, "utf8");
  const errFile = path.join(tempDir, "err.md");
  fs.writeFileSync(
    errFile,
    `---\nid: err\ntitle: Error Chapter\ndescription: Test error\n---\n${errorWords}`,
    "utf8",
  );

  const resError = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  fs.unlinkSync(errFile);
  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);

  expect(resError.errors).toHaveLength(1);
  expect(resError.errors[0].message).toContain("exceeding the limit of 25");
});

test("runValidation - handles cantonese, dialog, and exercise blocks", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-blocks-"));
  const currFile = path.join(tempDir, "curriculum.md");
  const chapterFile = path.join(tempDir, "blocks.md");

  const currMd = `---
chapters:
  - id: blocks
    title: Blocks Chapter
    file: blocks.md
---
`;
  fs.writeFileSync(currFile, currMd, "utf8");

  const chapterMd = `---
id: blocks
title: Blocks Chapter
description: Test validation of all block types
---
### Cantonese Block
\`\`\`cantonese
我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
===
I go to school.
\`\`\`

### Cantonese Block 2 (unannotated character)
\`\`\`cantonese
我[ngo5|I] 呀
===
I go
\`\`\`

### Cantonese Block 3 (Chinese character in English translation)
\`\`\`cantonese
我[ngo5|I]
===
I 呀
\`\`\`

### Cantonese Block 4 (invalid Jyutping in example annotation)
\`\`\`cantonese
我[ngo5-invalid|I]
===
I go
\`\`\`

### Dialog Block
\`\`\`dialog
A: 你[nei5|you] 好[hou2|good] 嗎[maa1|interrogative particle]？
=== A: How are you?
B: 我[ngo5|I] 幾[gei2|quite] 好[hou2|good]。
=== B: I am pretty good.
\`\`\`

### Dialog Block 2 (unannotated character in speaker turn)
\`\`\`dialog
A: 我[ngo5|I] 呀
=== A: I go
\`\`\`

### Dialog Block 3 (Chinese character in English translation line)
\`\`\`dialog
A: 我[ngo5|I]
=== A: I 呀
\`\`\`

### Dialog Block 4 (invalid speaker prefix)
\`\`\`dialog
A我[ngo5|I]
=== A: I
\`\`\`

### Dialog Block 5 (invalid Jyutping in speaker turn)
\`\`\`dialog
A: 我[ngo5-invalid|I]
=== A: I
\`\`\`

### Dialog Block 6 (odd number of lines)
\`\`\`dialog
A: 我[ngo5|I]
=== A: I
B: 你[nei5|you]
\`\`\`

### Exercise Block 1 (valid)
\`\`\`exercise
question: 你[nei5|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
explanation: This is an explanation.
\`\`\`

### Exercise Block 2 (unrecognized key)
\`\`\`exercise
invalidKey: test
question: 你[nei5|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
explanation: This is an explanation.
\`\`\`

### Exercise Block 3 (invalid Jyutping in field)
\`\`\`exercise
question: 你[nei5-invalid|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
explanation: This is an explanation.
\`\`\`

### Exercise Block 4 (missing required key)
\`\`\`exercise
question: 你[nei5|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
\`\`\`

### Invalid Exercise Block (will trigger parsed YAML error)
\`\`\`exercise
invalid: content
\`\`\`
`;
  fs.writeFileSync(chapterFile, chapterMd, "utf8");

  // Mock parseYAML to throw on the invalid block content
  const originalParseYAML = parser.parseYAML;
  vi.spyOn(parser, "parseYAML").mockImplementation((str) => {
    if (str.includes("invalid: content")) {
      throw new Error("Mocked parsing error");
    }
    return originalParseYAML(str);
  });

  const res = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  fs.unlinkSync(chapterFile);
  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
  vi.restoreAllMocks();

  expect(res.errors).toHaveLength(12);
  expect(res.errors[0].message).toContain("unannotated Chinese character");
  expect(res.errors[0].message).toContain("inside cantonese block");

  expect(res.errors[1].message).toContain("illegal Chinese character");
  expect(res.errors[1].message).toContain("English translation section");

  expect(res.errors[2].message).toContain("Invalid Jyutping format");
  expect(res.errors[2].message).toContain("in example annotation");

  expect(res.errors[3].message).toContain("unannotated Chinese character");
  expect(res.errors[3].message).toContain("inside dialogue speaker turn");

  expect(res.errors[4].message).toContain("illegal Chinese character");
  expect(res.errors[4].message).toContain("Dialogue English translation line");

  expect(res.errors[5].message).toContain(
    "Dialogue speaker turn must start with a letter and colon",
  );
  expect(res.errors[6].message).toContain("in dialogue turn");
  expect(res.errors[7].message).toContain("even number of lines");
  expect(res.errors[8].message).toContain("unrecognized key");
  expect(res.errors[9].message).toContain("inside exercise field");
  expect(res.errors[10].message).toContain("missing required key");
  expect(res.errors[11].message).toContain(
    "Failed to parse YAML inside exercise block",
  );
});

test("runValidation - handles curriculum.md parsing exception gracefully", () => {
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), "test-temp-err-curr-"),
  );
  const currFile = path.join(tempDir, "curriculum.md");
  fs.writeFileSync(currFile, "mock curriculum content", "utf8");

  vi.spyOn(parser, "parseCurriculum").mockImplementationOnce(() => {
    throw new Error("Mocked curriculum error");
  });

  const res = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
  vi.restoreAllMocks();

  expect(res.errors).toHaveLength(1);
  expect(res.errors[0].message).toContain("Failed to parse curriculum.md");
});

test("runValidation - handles parseChapter parsing exception gracefully", () => {
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), "test-temp-err-chapter-"),
  );
  const currFile = path.join(tempDir, "curriculum.md");
  const chapterFile = path.join(tempDir, "blocks.md");

  const currMd = `---
chapters:
  - id: blocks
    title: Blocks Chapter
    file: blocks.md
---
`;
  fs.writeFileSync(currFile, currMd, "utf8");
  fs.writeFileSync(chapterFile, "mock content", "utf8");

  vi.spyOn(parser, "parseChapter").mockImplementationOnce(() => {
    throw new Error("Mocked chapter error");
  });

  const res = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  fs.unlinkSync(chapterFile);
  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
  vi.restoreAllMocks();

  expect(res.errors).toHaveLength(1);
  expect(res.errors[0].message).toContain(
    "Failed to parse chapter file: Mocked chapter error",
  );
});

test("runValidation - handles parseChapter parsing exception on second pass gracefully", () => {
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), "test-temp-err-chapter-pass2-"),
  );
  const currFile = path.join(tempDir, "curriculum.md");
  const chapterFile = path.join(tempDir, "blocks.md");

  const currMd = `---
chapters:
  - id: blocks
    title: Blocks Chapter
    file: blocks.md
---
`;
  fs.writeFileSync(currFile, currMd, "utf8");
  fs.writeFileSync(
    chapterFile,
    "---\nid: blocks\ntitle: Blocks Chapter\ndescription: Test\n---\n",
    "utf8",
  );

  const originalParseChapter = parser.parseChapter;
  let parseChapterCount = 0;
  vi.spyOn(parser, "parseChapter").mockImplementation((filePath) => {
    parseChapterCount++;
    if (parseChapterCount === 2) {
      throw new Error("Mocked chapter error during second pass");
    }
    return originalParseChapter(filePath);
  });

  const res = validator.runValidation({
    projectRoot: tempDir,
    contentDir: tempDir,
    curriculumPath: currFile,
  });

  fs.unlinkSync(chapterFile);
  fs.unlinkSync(currFile);
  fs.rmdirSync(tempDir);
  vi.restoreAllMocks();

  expect(res.errors).toHaveLength(0); // Ignored and continues
});

test("main CLI - success execution path (full mode)", () => {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalArgv = process.argv;
  const originalRunValidation = validator.runValidation;

  let exitCode = null;
  process.exit = (code) => {
    exitCode = code;
  };
  process.argv = ["node", "validate-format.js"]; // Mock runValidation with a warning to cover the warning print branches
  validator.runValidation = () => ({
    errors: [],
    warnings: [
      { chapterId: "greetings", file: "content/greetings.md", count: 22 },
    ],
  });

  let logOutput = "";
  console.log = (msg) => {
    logOutput += msg + "\n";
  };
  console.warn = (msg) => {
    logOutput += msg + "\n";
  };
  console.error = () => {};

  try {
    validator.main();
  } finally {
    validator.runValidation = originalRunValidation;
    process.exit = originalExit;
    process.argv = originalArgv;
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }

  expect(exitCode).toBe(0);
  expect(logOutput).toContain("validation passed successfully");
  expect(logOutput).toContain("Vocabulary Count Warning");
});

test("main CLI - target file argument validation failure mode", () => {
  const originalExit = process.exit;
  const originalError = console.error;
  const originalArgv = process.argv;

  let exitCode = null;
  process.exit = (code) => {
    exitCode = code;
  };

  // Write a temporary bad file to validate
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), "test-temp-cli-"));
  const badFile = path.join(tempDir, "bad.md");
  fs.writeFileSync(
    badFile,
    "---\nid: bad\ntitle: Bad\ndescription: test\n---\n詞\n",
    "utf8",
  ); // unannotated Chinese character

  process.argv = ["node", "validate-format.js", badFile];

  let errOutput = "";
  console.error = (msg) => {
    errOutput += msg + "\n";
  };

  try {
    validator.main();
  } finally {
    fs.unlinkSync(badFile);
    fs.rmdirSync(tempDir);
    process.exit = originalExit;
    process.argv = originalArgv;
    console.error = originalError;
  }

  expect(exitCode).toBe(1);
  expect(errOutput).toContain("Validation Failed");
});
