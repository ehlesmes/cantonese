const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

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
  console.log(`\n${colors.cyan}${colors.bold}Running Vocabulary Tracker Unit Tests...${colors.reset}\n`);

  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.join(projectRoot, 'content');
  
  // Backup any existing vocabulary.json / vocabulary.md
  const jsonPath = path.join(contentDir, 'vocabulary.json');
  const mdPath = path.join(contentDir, 'vocabulary.md');
  
  const hasJsonBackup = fs.existsSync(jsonPath);
  const jsonBackup = hasJsonBackup ? fs.readFileSync(jsonPath, 'utf8') : null;
  
  const hasMdBackup = fs.existsSync(mdPath);
  const mdBackup = hasMdBackup ? fs.readFileSync(mdPath, 'utf8') : null;

  test('E2E Vocabulary Tracking - Homographs & Chronological First Introductions', () => {
    // Write temporary test chapters with numbers 98 and 99
    const testFile1 = path.join(contentDir, '98-test-vocab-one.md');
    const testFile2 = path.join(contentDir, '99-test-vocab-two.md');
    
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

    fs.writeFileSync(testFile1, content1, 'utf8');
    fs.writeFileSync(testFile2, content2, 'utf8');

    // Run track-vocabulary.js via node command
    try {
      execSync('node scripts/track-vocabulary.js', { cwd: projectRoot, stdio: 'pipe' });
    } catch (err) {
      assert.fail(`Failed to execute track-vocabulary.js: ${err.message}`);
    }

    // Read the generated JSON database
    assert.ok(fs.existsSync(jsonPath), 'vocabulary.json should be generated');
    const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Assertions:
    // 1. We should have 3 entries (homographs of "行" must be separate)
    // Filter out any other vocabulary if the repo currently has other files
    const testEntries = db.filter(item => 
      item.firstIntroducedIn === '98-test-vocab-one.md' || 
      item.firstIntroducedIn === '99-test-vocab-two.md'
    );

    assert.strictEqual(testEntries.length, 3, `Expected 3 test entries, got: ${JSON.stringify(testEntries)}`);

    // 2. Homograph hang4 check
    const hang4 = testEntries.find(item => item.character === '行' && item.jyutping === 'hang4');
    assert.ok(hang4);
    assert.strictEqual(hang4.translation, 'to walk');
    assert.strictEqual(hang4.firstIntroducedIn, '98-test-vocab-one.md');
    assert.strictEqual(hang4.occurrences, 1);

    // 3. Homograph hong4 check
    const hong4 = testEntries.find(item => item.character === '行' && item.jyutping === 'hong4');
    assert.ok(hong4);
    assert.strictEqual(hong4.translation, 'firm/industry');
    assert.strictEqual(hong4.firstIntroducedIn, '99-test-vocab-two.md');
    assert.strictEqual(hong4.occurrences, 1);

    // 4. "你好" check (should merge translation nuances and register first introduced file)
    const hello = testEntries.find(item => item.character === '你好');
    assert.ok(hello);
    assert.strictEqual(hello.firstIntroducedIn, '98-test-vocab-one.md');
    assert.strictEqual(hello.occurrences, 2);
    // Translations should merge "hello" and "hi / hello" -> "hello / hi / hello" (ignoring repeats is handled gracefully, or just check it contains hello and hi)
    assert.ok(hello.translation.includes('hello'));
    assert.ok(hello.translation.includes('hi'));

    // Clean up temporary files
    fs.unlinkSync(testFile1);
    fs.unlinkSync(testFile2);
  });

  // Restore Backups
  if (hasJsonBackup) {
    fs.writeFileSync(jsonPath, jsonBackup, 'utf8');
  } else if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
  }

  if (hasMdBackup) {
    fs.writeFileSync(mdPath, mdBackup, 'utf8');
  } else if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
  }

  // Summary
  console.log(`\n${colors.bold}Test Suite Result:${colors.reset}`);
  if (failedTests > 0) {
    console.error(`  ${colors.red}${colors.bold}FAIL: ${failedTests} of ${totalTests} tests failed.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`  ${colors.green}${colors.bold}PASS: All ${totalTests} tests passed successfully!${colors.reset}\n`);
    process.exit(0);
  }
}

runAllTests();
