const fs = require('fs');
const path = require('path');
const parser = require('./lib/parser');

// Premium CLI output styles
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Validates a single Jyutping syllable.
 * Syllables must consist of lowercase letters followed by a tone digit 1-6.
 * 
 * @param {string} jyutping 
 * @returns {string|null} Error message or null if valid
 */
function validateJyutping(jyutping) {
  if (!/^[a-z]+[1-6](?:[ -]?[a-z]+[1-6])*$/.test(jyutping)) {
    return `Invalid Jyutping format "${jyutping}" (must consist of lowercase syllables each containing letters followed by a tone digit 1-6)`;
  }
  return null;
}

/**
 * Validates a single chapter markdown file.
 * 
 * @param {string} filePath Absolute or relative path to the file
 * @param {object} [curriculumEntry] Associated curriculum mapping entry if available
 * @returns {Array<object>} List of errors
 */
function validateChapterFile(filePath, curriculumEntry) {
  const errors = [];
  const addError = (line, msg) => errors.push({ file: filePath, line, message: msg });
  
  const basename = path.basename(filePath);
  const prefixMatch = /^(\d{2})-(.*)\.md$/.exec(basename);
  
  if (!prefixMatch) {
    addError(0, `Filename "${basename}" does not follow the required double-digit prefix sorting convention (e.g., "01-greetings.md")`);
    return errors;
  }
  
  const fileChapterNum = parseInt(prefixMatch[1], 10);
  
  let chapterData;
  try {
    chapterData = parser.parseChapter(filePath);
  } catch (err) {
    addError(0, `Failed to parse chapter file: ${err.message}`);
    return errors;
  }
  
  const frontmatter = chapterData.frontmatter;
  if (!frontmatter) {
    addError(1, 'Missing YAML frontmatter block at the top of the file');
  } else {
    // Validate Frontmatter keys
    if (frontmatter.chapter === undefined) {
      addError(2, 'Frontmatter is missing required key "chapter"');
    } else if (typeof frontmatter.chapter !== 'number') {
      addError(2, `Frontmatter "chapter" value must be an integer (got "${frontmatter.chapter}")`);
    } else if (frontmatter.chapter !== fileChapterNum) {
      addError(2, `Frontmatter "chapter" (${frontmatter.chapter}) does not match the filename prefix chapter number (${fileChapterNum})`);
    }
    
    if (!frontmatter.title) {
      addError(2, 'Frontmatter is missing required key "title"');
    } else if (typeof frontmatter.title !== 'string') {
      addError(2, 'Frontmatter "title" must be a string');
    }
    
    if (!frontmatter.description) {
      addError(2, 'Frontmatter is missing required key "description"');
    } else if (typeof frontmatter.description !== 'string') {
      addError(2, 'Frontmatter "description" must be a string');
    }
    
    // Validate Frontmatter alignment with curriculum
    if (curriculumEntry) {
      if (frontmatter.chapter !== curriculumEntry.chapter) {
        addError(2, `Frontmatter chapter number (${frontmatter.chapter}) does not match the curriculum definition (${curriculumEntry.chapter})`);
      }
      if (frontmatter.title !== curriculumEntry.title) {
        addError(2, `Frontmatter title ("${frontmatter.title}") does not match the curriculum title ("${curriculumEntry.title}")`);
      }
    }
  }
  
  // Validate blocks
  for (const block of chapterData.blocks) {
    if (block.type === 'prose') {
      // Validate all lines of prose
      const lines = block.content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const currentLineNum = block.startLine + i;
        
        // Find inline semantic units
        const units = parser.extractInlineUnits(line);
        let cleanLine = line;
        
        // Sort right-to-left to keep indices accurate during replacement
        units.sort((a, b) => b.index - a.index);
        for (const unit of units) {
          // Check Jyutping
          const jpError = validateJyutping(unit.jyutping);
          if (jpError) {
            addError(currentLineNum, `${jpError} in inline annotation "${unit.raw}"`);
          }
          // Check for Roman characters in Chinese part
          if (/[a-zA-Z]/.test(unit.characters)) {
            addError(currentLineNum, `Chinese character section contains illegal alphabetical characters: "${unit.characters}"`);
          }
          
          cleanLine = cleanLine.slice(0, unit.index) + ' '.repeat(unit.raw.length) + cleanLine.slice(unit.index + unit.raw.length);
        }
        
        // Now check for any unannotated Chinese text
        const rawChineseMatch = parser.CHINESE_CHAR_REGEX.exec(cleanLine);
        if (rawChineseMatch) {
          const contextStart = Math.max(0, rawChineseMatch.index - 10);
          const contextEnd = Math.min(cleanLine.length, rawChineseMatch.index + 10);
          const snippet = cleanLine.slice(contextStart, contextEnd).trim();
          addError(
            currentLineNum, 
            `Found unannotated Chinese character "${rawChineseMatch[0]}" at column ${rawChineseMatch.index + 1}. ` +
            `All Chinese text must be formatted as \`Characters[Jyutping|Translation]\`. Snippet: "...${snippet}..."`
          );
        }
      }
      
    } else if (block.type === 'cantonese') {
      const lines = block.content.split(/\r?\n/);
      const sepCount = lines.filter(l => l.trim() === '===').length;
      
      if (sepCount !== 1) {
        addError(block.startLine, `Cantonese example block must contain exactly one separator line "===" (found ${sepCount})`);
        continue;
      }
      
      const sepIdx = lines.findIndex(l => l.trim() === '===');
      
      // Process Cantonese lines
      for (let i = 0; i < sepIdx; i++) {
        const line = lines[i];
        const currentLineNum = block.startLine + 1 + i;
        const units = parser.extractBlockUnits(line);
        let cleanLine = line;
        
        units.sort((a, b) => b.index - a.index);
        for (const unit of units) {
          const jpError = validateJyutping(unit.jyutping);
          if (jpError) {
            addError(currentLineNum, `${jpError} in example annotation "${unit.raw}"`);
          }
          if (/[a-zA-Z]/.test(unit.characters)) {
            addError(currentLineNum, `Chinese character section contains illegal alphabetical characters: "${unit.characters}"`);
          }
          
          cleanLine = cleanLine.slice(0, unit.index) + ' '.repeat(unit.raw.length) + cleanLine.slice(unit.index + unit.raw.length);
        }
        
        const rawChineseMatch = parser.CHINESE_CHAR_REGEX.exec(cleanLine);
        if (rawChineseMatch) {
          addError(
            currentLineNum,
            `Found unannotated Chinese character "${rawChineseMatch[0]}" inside cantonese block. ` +
            `Ensure all Chinese characters are annotated without backticks as Characters[Jyutping|Translation]`
          );
        }
      }
      
      // Process English lines
      for (let i = sepIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        const currentLineNum = block.startLine + 1 + i;
        const rawChineseMatch = parser.CHINESE_CHAR_REGEX.exec(line);
        if (rawChineseMatch) {
          addError(currentLineNum, `English translation section contains illegal Chinese character: "${rawChineseMatch[0]}"`);
        }
      }
      
    } else if (block.type === 'dialog') {
      const lines = block.content.split(/\r?\n/);
      
      if (lines.length % 2 !== 0) {
        addError(block.startLine, `Dialogue block must contain an even number of lines alternating between Speaker turn and English translation`);
      }
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const currentLineNum = block.startLine + 1 + i;
        
        if (i % 2 === 0) {
          // Speaker turn: must match A: ...
          const speakerMatch = /^([A-Za-z]+):\s*(.*)$/.exec(line);
          if (!speakerMatch) {
            addError(currentLineNum, `Dialogue speaker turn must start with a letter and colon (e.g. "A: "). Got: "${line}"`);
            continue;
          }
          
          const cantoneseText = speakerMatch[2];
          const units = parser.extractBlockUnits(cantoneseText);
          let cleanLine = cantoneseText;
          
          units.sort((a, b) => b.index - a.index);
          for (const unit of units) {
            const jpError = validateJyutping(unit.jyutping);
            if (jpError) {
              addError(currentLineNum, `${jpError} in dialogue turn "${unit.raw}"`);
            }
            if (/[a-zA-Z]/.test(unit.characters)) {
              addError(currentLineNum, `Chinese character section contains illegal alphabetical characters: "${unit.characters}"`);
            }
            
            cleanLine = cleanLine.slice(0, unit.index) + ' '.repeat(unit.raw.length) + cleanLine.slice(unit.index + unit.raw.length);
          }
          
          const rawChineseMatch = parser.CHINESE_CHAR_REGEX.exec(cleanLine);
          if (rawChineseMatch) {
            addError(
              currentLineNum,
              `Found unannotated Chinese character "${rawChineseMatch[0]}" inside dialogue speaker turn. ` +
              `All Cantonese text in speaker lines must be annotated as Characters[Jyutping|Translation]`
            );
          }
        } else {
          // Translation line: must match === ...
          const translationMatch = /^\s*===\s+(.*)$/.exec(line);
          if (!translationMatch) {
            addError(currentLineNum, `Dialogue translation line must be prefixed with exactly "=== ". Got: "${line}"`);
            continue;
          }
          
          const translationText = translationMatch[1];
          const rawChineseMatch = parser.CHINESE_CHAR_REGEX.exec(translationText);
          if (rawChineseMatch) {
            addError(currentLineNum, `Dialogue English translation line contains illegal Chinese character: "${rawChineseMatch[0]}"`);
          }
        }
      }
      
    } else if (block.type === 'exercise') {
      let data;
      try {
        data = parser.parseYAML(block.content);
      } catch (err) {
        addError(block.startLine, `Failed to parse YAML inside exercise block: ${err.message}`);
        continue;
      }
      
      const required = ['question', 'answer', 'explanation'];
      const keys = Object.keys(data);
      
      for (const req of required) {
        if (!(req in data)) {
          addError(block.startLine, `Exercise block is missing required key "${req}"`);
        }
      }
      
      for (const key of keys) {
        if (!required.includes(key)) {
          addError(block.startLine, `Exercise block contains unrecognized key "${key}"`);
        }
      }
      
      // Check each field string for proper annotations
      for (const field of required) {
        if (data[field]) {
          const valStr = String(data[field]);
          const units = parser.extractBlockUnits(valStr);
          
          let cleanVal = valStr;
          units.sort((a, b) => b.index - a.index);
          
          for (const unit of units) {
            const jpError = validateJyutping(unit.jyutping);
            if (jpError) {
              addError(block.startLine, `${jpError} inside exercise field "${field}"`);
            }
            if (/[a-zA-Z]/.test(unit.characters)) {
              addError(block.startLine, `Chinese character section contains illegal alphabetical characters in exercise field "${field}": "${unit.characters}"`);
            }
            
            cleanVal = cleanVal.slice(0, unit.index) + ' '.repeat(unit.raw.length) + cleanVal.slice(unit.index + unit.raw.length);
          }
          
          const rawChineseMatch = parser.CHINESE_CHAR_REGEX.exec(cleanVal);
          if (rawChineseMatch) {
            addError(
              block.startLine,
              `Found unannotated Chinese character "${rawChineseMatch[0]}" inside exercise field "${field}". ` +
              `All Chinese text inside exercises must be annotated as Characters[Jyutping|Translation]`
            );
          }
        }
      }
    }
  }
  
  return errors;
}

/**
 * Main execution sequence
 */
function main() {
  const targetArg = process.argv[2];
  
  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.join(projectRoot, 'content');
  const curriculumPath = path.join(contentDir, 'curriculum.md');
  
  let curriculumChapters = [];
  try {
    if (fs.existsSync(curriculumPath)) {
      curriculumChapters = parser.parseCurriculum(curriculumPath);
    }
  } catch (err) {
    console.error(`${colors.red}${colors.bold}ERROR: Failed to parse curriculum.md frontmatter chapter mapping:${colors.reset}`);
    console.error(err.message);
    process.exit(1);
  }
  
  let allErrors = [];
  
  if (targetArg) {
    // Single file validation mode
    const filePath = path.resolve(targetArg);
    
    if (!fs.existsSync(filePath)) {
      console.error(`${colors.red}${colors.bold}ERROR: File not found: "${targetArg}"${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.cyan}Validating single file: ${colors.bold}${path.relative(projectRoot, filePath)}${colors.reset}\n`);
    
    const basename = path.basename(filePath);
    const curriculumEntry = curriculumChapters.find(c => c.file === basename);
    
    const fileErrors = validateChapterFile(filePath, curriculumEntry);
    allErrors.push(...fileErrors);
    
  } else {
    // Full validation mode
    console.log(`${colors.cyan}${colors.bold}Running chapter format validation in Full Mode...${colors.reset}\n`);
    
    if (!fs.existsSync(contentDir)) {
      console.error(`${colors.red}${colors.bold}ERROR: Content directory not found at "${contentDir}"${colors.reset}`);
      process.exit(1);
    }
    
    // Read all md files in content directory
    const files = fs.readdirSync(contentDir);
    const chapterFiles = files.filter(f => /^\d{2}-.*\.md$/.test(f));
    
    // 1. Check curriculum chapter list alignment (non-existent chapters are logged as warnings to support sequential authoring)
    const missingChapters = [];
    for (const c of curriculumChapters) {
      const expectedPath = path.join(contentDir, c.file);
      if (!fs.existsSync(expectedPath)) {
        missingChapters.push(c.file);
      }
    }
    if (missingChapters.length > 0) {
      console.log(`${colors.yellow}${colors.bold}⚠️  Curriculum Warning: The following planned chapters are registered in curriculum.md but have not been created yet:${colors.reset}`);
      for (const f of missingChapters) {
        console.log(`  - ${f}`);
      }
      console.log('');
    }
    
    // 2. Validate each chapter file
    for (const file of chapterFiles) {
      const fullPath = path.join(contentDir, file);
      const curriculumEntry = curriculumChapters.find(c => c.file === file);
      
      if (!curriculumEntry) {
        allErrors.push({
          file: path.relative(projectRoot, fullPath),
          line: 0,
          message: `Chapter file "${file}" exists but is not registered in the content/curriculum.md frontmatter`
        });
      }
      
      const fileErrors = validateChapterFile(fullPath, curriculumEntry);
      allErrors.push(...fileErrors);
    }
  }
  
  // Report results
  if (allErrors.length > 0) {
    console.error(`${colors.red}${colors.bold}Validation Failed! Found ${allErrors.length} format error(s):${colors.reset}\n`);
    
    // Group errors by file
    const grouped = {};
    for (const err of allErrors) {
      const relPath = path.relative(projectRoot, err.file);
      if (!grouped[relPath]) grouped[relPath] = [];
      grouped[relPath].push(err);
    }
    
    for (const [file, errs] of Object.entries(grouped)) {
      console.error(`${colors.yellow}${colors.bold}📄 File: ${file}${colors.reset}`);
      for (const err of errs) {
        const lineStr = err.line > 0 ? `Line ${err.line}: ` : '';
        console.error(`  ${colors.red}✗${colors.reset} ${lineStr}${err.message}`);
      }
      console.error('');
    }
    
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✓ Formatting validation passed successfully!${colors.reset}\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateJyutping,
  validateChapterFile
};
