const fs = require("fs");
const path = require("path");
const { validateJyutping } = require("./validate-format");

// Premium CLI output styles
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

const VALID_TYPES = [
  "pronoun",
  "verb",
  "adverb",
  "noun",
  "adjective",
  "expression",
  "classifier",
  "conjunction",
  "preposition",
  "numeral",
  "particle",
  "auxiliary verb",
];

function showUsage() {
  console.log(`
${colors.bold}${colors.cyan}Cantonese Lexicon Dictionary Registrar${colors.reset}
${colors.dim}Programmatically register new vocabulary words into the local dictionary database.${colors.reset}

${colors.bold}Usage:${colors.reset}
  node scripts/register-word.js <character> <jyutping> "<definition>" <type> "[notes]"

${colors.bold}Example:${colors.reset}
  node scripts/register-word.js 叉燒 caa1siu1 "barbecued pork / char siu" noun "A very popular Cantonese meat dish."
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    showUsage();
    process.exit(1);
  }

  const [character, jyutping, definition, type, notes] = args;

  // 1. Validation checks
  if (!character.trim()) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Character cannot be empty.${colors.reset}`,
    );
    process.exit(1);
  }

  // Check Jyutping
  const jpError = validateJyutping(jyutping.trim());
  if (jpError) {
    console.error(
      `${colors.red}${colors.bold}ERROR: ${jpError}${colors.reset}`,
    );
    process.exit(1);
  }

  if (!definition.trim()) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Definition cannot be empty.${colors.reset}`,
    );
    process.exit(1);
  }

  // Validate type
  const normalizedType = type.trim().toLowerCase();
  if (!VALID_TYPES.includes(normalizedType)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Invalid word type "${type}".${colors.reset}`,
    );
    console.error(
      `Valid types are: ${colors.cyan}${VALID_TYPES.join(", ")}${colors.reset}`,
    );
    process.exit(1);
  }

  const dictPath = path.join(__dirname, "../content/dictionary.json");

  if (!fs.existsSync(dictPath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Dictionary database not found at "${dictPath}"${colors.reset}`,
    );
    process.exit(1);
  }

  let dictionary;
  try {
    dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  } catch (err) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse dictionary:${colors.reset} ${err.message}`,
    );
    process.exit(1);
  }

  // Check duplicate
  const isDuplicate = dictionary.some(
    (entry) =>
      entry.char === character.trim() && entry.jyutping === jyutping.trim(),
  );

  if (isDuplicate) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Word "${character}" with Jyutping "${jyutping}" is already registered in the dictionary.${colors.reset}`,
    );
    process.exit(1);
  }

  // Assemble new entry
  const newEntry = {
    char: character.trim(),
    jyutping: jyutping.trim(),
    definition: definition.trim(),
    type: normalizedType,
  };

  if (notes && notes.trim()) {
    newEntry.notes = notes.trim();
  }

  // Add and sort dictionary
  dictionary.push(newEntry);
  dictionary.sort((a, b) => {
    const jpCompare = a.jyutping.localeCompare(b.jyutping);
    if (jpCompare !== 0) return jpCompare;
    return a.char.localeCompare(b.char);
  });

  // Write back
  try {
    fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2), "utf8");
    console.log(
      `\n${colors.green}${colors.bold}✓ Successfully registered new word:${colors.reset}`,
    );
    console.log(
      `  ✨ ${colors.cyan}${newEntry.char}${colors.reset} (${colors.yellow}${newEntry.jyutping}${colors.reset}) — ${newEntry.type}`,
    );
    console.log(`     • Definition: ${newEntry.definition}`);
    if (newEntry.notes) {
      console.log(`     • Notes:      ${newEntry.notes}`);
    }
    console.log("");
  } catch (err) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to write to dictionary.json:${colors.reset} ${err.message}`,
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
