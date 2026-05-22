const fs = require('fs');
const path = require('path');
const assert = require('assert');
const parser = require('./lib/parser');
const validator = require('./validate-format');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Simple test runner helper
let totalTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ${colors.green}✓ Passed:${colors.reset} ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ${colors.red}✗ Failed:${colors.reset} ${name}`);
    console.error(err);
  }
}

function runAllTests() {
  console.log(`\n${colors.cyan}${colors.bold}Running Validator Unit Tests...${colors.reset}\n`);

  // ==========================================
  // 1. YAML Parser Tests
  // ==========================================
  test('YAML - Flat keys parsing', () => {
    const yaml = `
chapter: 1
title: Greetings & Courtesy
description: Learn greetings.
`;
    const parsed = parser.parseYAML(yaml);
    assert.strictEqual(parsed.chapter, 1);
    assert.strictEqual(parsed.title, 'Greetings & Courtesy');
    assert.strictEqual(parsed.description, 'Learn greetings.');
  });

  test('YAML - Multiline block parsing with |', () => {
    const yaml = `
question: |
  Fill in the blank:
  我想 ____ 點心。
answer: 食
`;
    const parsed = parser.parseYAML(yaml);
    assert.strictEqual(parsed.question, 'Fill in the blank:\n我想 ____ 點心。');
    assert.strictEqual(parsed.answer, '食');
  });

  test('YAML - Array of objects parsing', () => {
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
    assert.ok(Array.isArray(parsed.chapters));
    assert.strictEqual(parsed.chapters.length, 2);
    assert.strictEqual(parsed.chapters[0].chapter, 0);
    assert.strictEqual(parsed.chapters[0].title, 'Intro');
    assert.strictEqual(parsed.chapters[0].file, '00-intro.md');
    assert.strictEqual(parsed.chapters[1].chapter, 1);
    assert.strictEqual(parsed.chapters[1].file, '01-greetings.md');
  });

  // ==========================================
  // 2. Jyutping Validation Tests
  // ==========================================
  test('Jyutping - Valid cases', () => {
    assert.strictEqual(validator.validateJyutping('nei5hou2'), null);
    assert.strictEqual(validator.validateJyutping('m4goi1'), null);
    assert.strictEqual(validator.validateJyutping('m4sai2 haak3hei3'), null);
    assert.strictEqual(validator.validateJyutping('ng5'), null);
    assert.strictEqual(validator.validateJyutping('saam1sap6-man1'), null); // hyphenated compound
  });

  test('Jyutping - Invalid cases', () => {
    assert.ok(validator.validateJyutping('nei5hou')); // missing tone digit
    assert.ok(validator.validateJyutping('nei5hou27')); // multiple digits/invalid
    assert.ok(validator.validateJyutping('NEI5hou2')); // uppercase letter
    assert.ok(validator.validateJyutping('nei5hou2 ')); // trailing space parsed internally - handled by trim but inside word is caught
  });

  // ==========================================
  // 3. Semantic Unit Extraction Tests
  // ==========================================
  test('Extraction - Inline semantic units', () => {
    const text = 'The basic greeting is `你好[nei5hou2|hello]`, and `唔該[m4goi1|excuse me]`.';
    const units = parser.extractInlineUnits(text);
    assert.strictEqual(units.length, 2);
    assert.strictEqual(units[0].characters, '你好');
    assert.strictEqual(units[0].jyutping, 'nei5hou2');
    assert.strictEqual(units[0].translation, 'hello');
    assert.strictEqual(units[1].characters, '唔該');
    assert.strictEqual(units[1].jyutping, 'm4goi1');
    assert.strictEqual(units[1].translation, 'excuse me');
  });

  test('Extraction - Block semantic units', () => {
    const text = '唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want]買。';
    const units = parser.extractBlockUnits(text);
    assert.strictEqual(units.length, 3);
    assert.strictEqual(units[0].characters, '唔該');
    assert.strictEqual(units[0].jyutping, 'm4goi1');
    assert.strictEqual(units[1].characters, '我');
    assert.strictEqual(units[1].jyutping, 'ngo5');
    assert.strictEqual(units[2].characters, '想');
    assert.strictEqual(units[2].jyutping, 'soeng2');
  });

  // ==========================================
  // 4. E2E File Parsing & Validation Tests
  // ==========================================
  test('E2E Chapter Validation - Valid Chapter', () => {
    const tempDir = path.join(__dirname, 'tmp_test');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const validFile = path.join(tempDir, '01-valid.md');
    
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
    fs.writeFileSync(validFile, validContent, 'utf8');

    const curriculumEntry = { chapter: 1, title: 'Greetings & Courtesy', file: '01-valid.md' };
    const errors = validator.validateChapterFile(validFile, curriculumEntry);
    
    // Clean up
    fs.unlinkSync(validFile);
    fs.rmdirSync(tempDir);

    assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${JSON.stringify(errors)}`);
  });

  test('E2E Chapter Validation - Invalid Chapter File', () => {
    const tempDir = path.join(__dirname, 'tmp_test_invalid');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const invalidFile = path.join(tempDir, '02-invalid.md');
    
    const invalidContent = `---
chapter: 3
title: Incorrect Chapter Num
description: This description is okay.
---

# Incorrect Chapter Num

We have raw Chinese text here: 你好.
And a malformed inline unit \`你好[nei5hou|missing tone digit]\`.

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
    fs.writeFileSync(invalidFile, invalidContent, 'utf8');

    const curriculumEntry = { chapter: 2, title: 'Incorrect Chapter Num', file: '02-invalid.md' };
    const errors = validator.validateChapterFile(invalidFile, curriculumEntry);
    
    // Clean up
    fs.unlinkSync(invalidFile);
    fs.rmdirSync(tempDir);

    // Let's assert we got exactly the expected violations!
    // 1. Chapter number mismatch (frontmatter says 3, filename prefix says 02, curriculum says 2)
    const chapNumError = errors.find(e => e.message.includes('frontmatter chapter number') || e.message.includes('does not match the filename prefix'));
    assert.ok(chapNumError);

    // 2. Unannotated Chinese in prose (Line 9: "你好.")
    const rawChineseProse = errors.find(e => e.line === 9 && e.message.includes('Found unannotated Chinese character "你"'));
    assert.ok(rawChineseProse);

    // 3. Malformed Jyutping in prose (Line 10: "nei5hou" lacks tone digit)
    const malformedJpProse = errors.find(e => e.line === 10 && e.message.includes('Invalid Jyutping format "nei5hou"'));
    assert.ok(malformedJpProse);

    // 4. Duplicate/invalid separator count in cantonese block
    const cantoneseSepErr = errors.find(e => e.message.includes('Cantonese example block must contain exactly one separator line'));
    assert.ok(cantoneseSepErr);

    // 5. Dialogue block missing correct prefixed translation
    const dialogTransErr = errors.find(e => e.message.includes('Dialogue translation line must be prefixed with exactly "=== "'));
    assert.ok(dialogTransErr);

    // 6. Exercise block unannotated Chinese character
    const exerciseChineseErr = errors.find(e => e.message.includes('Found unannotated Chinese character "唔" inside exercise field "answer"'));
    assert.ok(exerciseChineseErr);
  });

  // Final summary
  console.log(`\n${colors.bold}Test Suite Result:${colors.reset}`);
  if (failedTests > 0) {
    console.error(`  ${colors.red}${colors.bold}FAIL: ${failedTests} of ${totalTests} tests failed.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`  ${colors.green}${colors.bold}PASS: All ${totalTests} tests passed successfully!${colors.reset}\n`);
  }
}

runAllTests();
