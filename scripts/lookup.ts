import * as fs from "fs";
import * as path from "path";
import { lookupDictionary } from "../src/utils/text.js";
import type { DictionaryEntry } from "../src/utils/text.js";

// Premium CLI output styles
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

/**
 * Display the CLI usage instructions.
 */
function showUsage() {
  console.log(`
${colors.bold}${colors.cyan}Cantonese Lexicon Lookup Utility${colors.reset}
${colors.dim}A programmatically accurate local dictionary query tool to prevent Jyutping hallucinations.${colors.reset}

${colors.bold}Usage (Single or Space-Separated Batch):${colors.reset}
  npm run vocab:lookup -- <query1> [query2] [query3]...

${colors.bold}Usage (Batch JSON String):${colors.reset}
  npm run vocab:lookup -- --json '<JSON-array-string>'

${colors.bold}Examples:${colors.reset}
  npm run vocab:lookup -- 唔該 八達通 檸茶  ${colors.dim}# Space-separated batch lookup${colors.reset}
  npm run vocab:lookup -- --json '["唔該", "八達通"]' ${colors.dim}# JSON batch lookup${colors.reset}
`);
}

/**
 * Main execution function.
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(0);
  }

  let queries: string[] = [];

  if (args[0] === "--json") {
    const jsonStr = args[1];
    if (!jsonStr) {
      console.error(
        `${colors.red}${colors.bold}ERROR: --json requires a JSON string argument.${colors.reset}`,
      );
      process.exit(1);
    }
    try {
      queries = JSON.parse(jsonStr) as string[];
      if (!Array.isArray(queries)) {
        throw new Error("Input must be a JSON array of query strings");
      }
    } catch (err: unknown) {
      console.error(
        `${colors.red}${colors.bold}ERROR: Failed to parse batch JSON:${colors.reset} ${(err as Error).message}`,
      );
      process.exit(1);
    }
  } else {
    queries = args.map((q) => q.trim()).filter((q) => q !== "");
  }

  if (queries.length === 0) {
    showUsage();
    process.exit(0);
  }

  const dictPath = path.join(__dirname, "../content/dictionary.json");

  if (!fs.existsSync(dictPath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Local dictionary database not found at "${dictPath}"${colors.reset}`,
    );
    console.error(
      `Please ensure "content/dictionary.json" has been correctly created.`,
    );
    process.exit(1);
  }

  let dictionary: DictionaryEntry[];
  try {
    dictionary = JSON.parse(
      fs.readFileSync(dictPath, "utf8"),
    ) as DictionaryEntry[];
  } catch (err: unknown) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse dictionary database:${colors.reset} ${(err as Error).message}`,
    );
    process.exit(1);
  }

  console.log(
    `\n🔍 ${colors.bold}${colors.cyan}Cantonese Lexicon Lookup${colors.reset}`,
  );
  console.log(
    `${colors.dim}Querying database for ${queries.length} ${queries.length === 1 ? "term" : "terms"}...${colors.reset}\n`,
  );

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]!.trim();
    if (query === "") continue;

    const matches = lookupDictionary(dictionary, query);

    console.log(
      `  [${i + 1}/${queries.length}] ${colors.bold}Query:${colors.reset} "${colors.cyan}${query}${colors.reset}"`,
    );

    if (matches.length === 0) {
      console.log(
        `    ${colors.yellow}✗ No matching entries found in the dictionary.${colors.reset}\n`,
      );
      continue;
    }

    console.log(
      `    ${colors.dim}Found ${matches.length} matching ${matches.length === 1 ? "entry" : "entries"}:${colors.reset}\n`,
    );

    for (const entry of matches) {
      const typeLabel = entry!.type
        ? `${colors.magenta}${entry!.type.charAt(0).toUpperCase() + entry!.type.slice(1)}${colors.reset}`
        : "Word";

      console.log(
        `      ✨ ${colors.green}${colors.bold}${entry.char}${colors.reset} (${colors.yellow}${entry!.jyutping}${colors.reset}) — ${typeLabel}`,
      );
      console.log(
        `         ${colors.bold}• Definition:${colors.reset} ${entry!.definition}`,
      );

      if (entry!.notes) {
        console.log(
          `         ${colors.bold}• Notes:${colors.reset}      ${colors.dim}${entry!.notes}${colors.reset}`,
        );
      }
      if (!entry) continue;
      if (!entry) continue;
    }
  }
}

if (require.main === module) {
  main();
}

export {};
