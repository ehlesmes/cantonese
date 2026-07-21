import * as fs from "fs";
import * as path from "path";
import {
  sortDictionary,
  processEntries,
  type RawEntry,
  type DictionaryEntry,
} from "./lib/register-utils.js";

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

function showUsage() {
  console.log(`
${colors.bold}${colors.cyan}Cantonese Lexicon Dictionary Registrar${colors.reset}
${colors.dim}Programmatically register new vocabulary words into the local dictionary database.${colors.reset}

${colors.bold}Usage (Single Entry):${colors.reset}
  npm run vocab:register -- <character> <jyutping> "<definition>" <type> "[notes]"

${colors.bold}Usage (Batch JSON String):${colors.reset}
  npm run vocab:register -- --json '<JSON-array-string>'

${colors.bold}Usage (Batch File):${colors.reset}
  npm run vocab:register -- --file <path-to-json-file>

${colors.bold}Examples:${colors.reset}
  npm run vocab:register -- 叉燒 caa1siu1 "barbecued pork" noun "Popular meat dish"
  npm run vocab:register -- --json '[{"char":"我","jyutping":"ngo5","definition":"I / me","type":"pronoun"}]'
`);
}

function parseBatchEntries(args: string[]): {
  batchEntries: RawEntry[];
  isBatch: boolean;
} {
  let batchEntries: RawEntry[] = [];
  let isBatch = false;

  const jsonFlagIndex = args.indexOf("--json");
  const fileFlagIndex = args.indexOf("--file");

  if (jsonFlagIndex !== -1) {
    isBatch = true;
    const jsonStr = args[jsonFlagIndex + 1];
    if (!jsonStr) {
      console.error(
        `${colors.red}${colors.bold}ERROR: Missing JSON string after --json flag.${colors.reset}`,
      );
      process.exit(1);
    }
    try {
      batchEntries = JSON.parse(jsonStr) as RawEntry[];
      if (!Array.isArray(batchEntries)) batchEntries = [batchEntries];
    } catch (err: unknown) {
      console.error(
        `${colors.red}${colors.bold}ERROR: Failed to parse --json string:${colors.reset} ${(err as Error).message}`,
      );
      process.exit(1);
    }
  } else if (fileFlagIndex !== -1) {
    isBatch = true;
    const filePath = args[fileFlagIndex + 1];
    if (!filePath) {
      console.error(
        `${colors.red}${colors.bold}ERROR: Missing file path after --file flag.${colors.reset}`,
      );
      process.exit(1);
    }
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(
        `${colors.red}${colors.bold}ERROR: File not found at "${resolvedPath}"${colors.reset}`,
      );
      process.exit(1);
    }
    try {
      const content = fs.readFileSync(resolvedPath, "utf8");
      batchEntries = JSON.parse(content) as RawEntry[];
      if (!Array.isArray(batchEntries)) batchEntries = [batchEntries];
    } catch (err: unknown) {
      console.error(
        `${colors.red}${colors.bold}ERROR: Failed to parse JSON file at "${resolvedPath}":${colors.reset} ${(err as Error).message}`,
      );
      process.exit(1);
    }
  } else {
    if (args.length < 4) {
      showUsage();
      process.exit(1);
    }
    const [character, jyutping, definition, type, notes] = args;
    batchEntries = [
      {
        char: character,
        jyutping: jyutping,
        definition: definition,
        type: type,
        notes: notes,
      },
    ];
  }

  return { batchEntries, isBatch };
}

function loadDictionary(dictPath: string): DictionaryEntry[] {
  if (!fs.existsSync(dictPath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Dictionary database not found at "${dictPath}"${colors.reset}`,
    );
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(dictPath, "utf8")) as DictionaryEntry[];
  } catch (err: unknown) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse dictionary:${colors.reset} ${(err as Error).message}`,
    );
    process.exit(1);
  }
}

function writeAndPrintDictionary(
  dictPath: string,
  dictionary: DictionaryEntry[],
  processedEntries: DictionaryEntry[],
) {
  try {
    fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2), "utf8");
    console.log(
      `\n${colors.green}${colors.bold}✓ Successfully registered ${processedEntries.length} new word(s):${colors.reset}`,
    );
    for (const entry of processedEntries) {
      console.log(
        `  ✨ ${colors.cyan}${entry.char}${colors.reset} (${colors.yellow}${entry.jyutping}${colors.reset}) — ${entry.type}`,
      );
      console.log(`     • Definition: ${entry.definition}`);
      if (entry.notes) {
        console.log(`     • Notes:      ${entry.notes}`);
      }
    }
    console.log("");
  } catch (err: unknown) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to write to dictionary.json:${colors.reset} ${(err as Error).message}`,
    );
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const { batchEntries, isBatch } = parseBatchEntries(args);

  if (batchEntries.length === 0) {
    console.error(
      `${colors.red}${colors.bold}ERROR: The batch list is empty.${colors.reset}`,
    );
    process.exit(1);
  }

  const dictPath =
    process.env.DICT_PATH || path.join(__dirname, "../content/dictionary.json");
  let dictionary = loadDictionary(dictPath);

  const { processedEntries, errors } = processEntries(
    batchEntries,
    dictionary,
    isBatch,
  );

  if (errors.length > 0) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Batch registration failed due to the following validation errors:${colors.reset}`,
    );
    for (const err of errors) {
      console.error(`  ${colors.red}✗${colors.reset} ${err}`);
    }
    process.exit(1);
  }

  for (const entry of processedEntries) {
    dictionary.push(entry);
  }

  dictionary = sortDictionary(dictionary);

  writeAndPrintDictionary(dictPath, dictionary, processedEntries);
}

if (require.main === module) {
  main();
}

export {};
