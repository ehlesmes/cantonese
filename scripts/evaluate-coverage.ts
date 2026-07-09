import * as fs from "fs";
import * as path from "path";

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

const REF_PATH = path.join(__dirname, "../content/reference_top1000.json");
const DICT_PATH = path.join(__dirname, "../content/dictionary.json");

if (!fs.existsSync(REF_PATH)) {
  console.error(
    `${colors.red}${colors.bold}ERROR: Reference list not found at "${REF_PATH}"${colors.reset}`,
  );
  console.error("Please run `npm run vocab:build-ref` first.");
  process.exit(1);
}

if (!fs.existsSync(DICT_PATH)) {
  console.error(
    `${colors.red}${colors.bold}ERROR: Dictionary database not found at "${DICT_PATH}"${colors.reset}`,
  );
  process.exit(1);
}

const refWords: any[] = JSON.parse(fs.readFileSync(REF_PATH, "utf8"));
const dictEntries: any[] = JSON.parse(fs.readFileSync(DICT_PATH, "utf8"));

// Create a lookup set of characters taught in the course
const taughtChars = new Set(dictEntries.map((entry: any) => entry.char.trim()));

console.log(
  `\n📊 ${colors.bold}${colors.cyan}Cantonese Curriculum Vocabulary Coverage Evaluation${colors.reset}`,
);
console.log(
  `${colors.dim}Evaluating course dictionary against the top 1000 spoken Cantonese words (Cifu)...${colors.reset}\n`,
);

let totalCovered = 0;
const brackets = [
  { name: "Top 100", startRank: 1, endRank: 100, covered: 0, total: 100 },
  { name: "Top 100–300", startRank: 101, endRank: 300, covered: 0, total: 200 },
  { name: "Top 300–500", startRank: 301, endRank: 500, covered: 0, total: 200 },
  {
    name: "Top 500–1000",
    startRank: 501,
    endRank: 1000,
    covered: 0,
    total: 500,
  },
];

const missingWords = [];

const variantMap: Record<string, string> = {
  啊: "呀",
  畀: "俾",
  比: "俾",
  左: "咗",
  地: "哋",
  重: "仲",
};

for (const ref of refWords) {
  let isCovered = taughtChars.has(ref.char);
  if (!isCovered && variantMap[ref.char]) {
    isCovered = taughtChars.has(variantMap[ref.char]);
  }

  if (isCovered) {
    totalCovered++;
    // Add to bracket count
    for (const b of brackets) {
      if (ref.rank >= b.startRank && ref.rank <= b.endRank) {
        b.covered++;
        break;
      }
    }
  } else {
    missingWords.push(ref);
  }
}

// 1. Overall Summary
const overallPct = ((totalCovered / refWords.length) * 100).toFixed(1);
console.log(
  `${colors.bold}Overall Coverage:${colors.reset} ${colors.green}${totalCovered}/${refWords.length} (${overallPct}%)${colors.reset}`,
);

// 2. Bracket Breakdown
console.log(`\n${colors.bold}Coverage by Frequency Brackets:${colors.reset}`);
for (const b of brackets) {
  const pct = (b.total > 0 ? (b.covered / b.total) * 100 : 0).toFixed(1);
  let color = colors.red;
  if (parseFloat(pct) >= 80) color = colors.green;
  else if (parseFloat(pct) >= 50) color = colors.yellow;

  console.log(
    `  • ${b.name.padEnd(14)}: ${color}${b.covered.toString().padStart(3)}/${b.total} (${pct}%)${colors.reset}`,
  );
}

// 3. Top Missing Words (Ranked by Frequency)
console.log(
  `\n${colors.bold}${colors.yellow}Top 50 Missing Spoken Words (Ranked by Frequency):${colors.reset}`,
);
const displayLimit = Math.min(50, missingWords.length);

console.log(
  `${colors.dim}${"Rank".padStart(5)}  ${"Word".padEnd(8)}  ${"Jyutping".padEnd(12)}  ${"Translation"}${colors.reset}`,
);
console.log(
  `${colors.dim}----------------------------------------------------------------------------${colors.reset}`,
);

for (let i = 0; i < displayLimit; i++) {
  const word = missingWords[i];
  console.log(
    `${colors.magenta}${word.rank.toString().padStart(5)}${colors.reset}  ` +
      `${colors.bold}${colors.green}${word.char.padEnd(8)}${colors.reset}  ` +
      `${colors.yellow}${word.jyutping.padEnd(12)}${colors.reset}  ` +
      `${colors.dim}${word.translation}${colors.reset}`,
  );
}

console.log(
  `\n💡 ${colors.bold}Recommendation:${colors.reset} Prioritize incorporating the top missing words into early chapters to raise foundational vocabulary coverage.`,
);

export {};
