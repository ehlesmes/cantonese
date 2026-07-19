import * as fs from "fs";
import * as path from "path";
import * as parser from "./lib/parser";
import { DictionaryEntryArraySchema } from "../src/utils/schemas";
import {
  findUnregisteredWords,
  extractChapterUnits,
  type DictionaryEntry,
} from "./lib/register-utils.js";

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
${colors.bold}${colors.cyan}Cantonese Unregistered Vocabulary Template Generator${colors.reset}
${colors.dim}Finds unregistered vocabulary in a chapter and generates a JSON template for registration.${colors.reset}

${colors.bold}Usage:${colors.reset}
  npm run vocab:register-missing -- <chapter_file_path> [--draft]

${colors.bold}Example:${colors.reset}
  npm run vocab:register-missing -- content/greetings.md
`);
}

function main() {
  const args = process.argv.slice(2);
  const chapterPath = args.find((arg) => !arg.startsWith("-"));

  if (!chapterPath) {
    showUsage();
    process.exit(1);
  }

  const absolutePath = path.resolve(chapterPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Chapter file not found at "${chapterPath}"${colors.reset}`,
    );
    process.exit(1);
  }

  const dictPath =
    process.env.DICT_PATH || path.join(__dirname, "../content/dictionary.json");
  if (!fs.existsSync(dictPath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Master dictionary database not found at "${dictPath}"${colors.reset}`,
    );
    process.exit(1);
  }

  let dictionary: DictionaryEntry[];
  try {
    const rawDict = JSON.parse(fs.readFileSync(dictPath, "utf8")) as unknown;
    dictionary = DictionaryEntryArraySchema.parse(rawDict) as DictionaryEntry[];
  } catch (err: unknown) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse master dictionary:${colors.reset} ${(err as Error).message}`,
    );
    process.exit(1);
  }

  let chapterData;
  try {
    const content = fs.readFileSync(absolutePath, "utf8");
    chapterData = parser.parseChapter(content);
    if (!chapterData.frontmatter) throw new Error("Missing frontmatter");
  } catch (err: unknown) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse chapter file:${colors.reset} ${(err as Error).message}`,
    );
    process.exit(1);
  }

  const chapterUnits = extractChapterUnits(chapterData);

  const unregisteredList = findUnregisteredWords(chapterUnits, dictionary);

  if (unregisteredList.length === 0) {
    console.log(
      `${colors.green}${colors.bold}✓ All vocabulary terms in this chapter are already registered!${colors.reset}\n`,
    );
    process.exit(0);
  }

  console.log(
    `🔍 Found ${colors.bold}${unregisteredList.length}${colors.reset} unregistered vocabulary word(s).\n`,
  );

  // Write to a temporary file for batch registration convenience
  const tmpDir = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const draftPath = path.join(tmpDir, "register-missing-draft.json");
  fs.writeFileSync(
    draftPath,
    JSON.stringify(unregisteredList, null, 2),
    "utf8",
  );

  console.log(
    `${colors.yellow}Generated registration draft JSON file at:${colors.reset}`,
  );
  console.log(
    `  ${colors.bold}${path.relative(path.join(__dirname, ".."), draftPath)}${colors.reset}\n`,
  );

  console.log(`${colors.bold}JSON Content Template:${colors.reset}`);
  console.log(JSON.stringify(unregisteredList, null, 2));
  console.log(`
${colors.cyan}${colors.bold}Next Steps:${colors.reset}
  1. Open ${colors.bold}tmp/register-missing-draft.json${colors.reset}
  2. Review the fields and replace any ${colors.yellow}"TODO_TYPE"${colors.reset} values with valid grammatical types (e.g. noun, verb, expression).
  3. Register the draft:
     ${colors.bold}npm run vocab:register -- --file tmp/register-missing-draft.json${colors.reset}
`);
}

if (require.main === module) {
  main();
}

export {};
