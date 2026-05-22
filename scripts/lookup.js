const fs = require("fs");
const path = require("path");

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

${colors.bold}Usage:${colors.reset}
  node scripts/lookup.js <query>

${colors.bold}Examples:${colors.reset}
  node scripts/lookup.js 唔該         ${colors.dim}# Lookup by Traditional characters (exact or partial)${colors.reset}
  node scripts/lookup.js m4goi1       ${colors.dim}# Lookup by LSHK Jyutping (exact or partial)${colors.reset}
  node scripts/lookup.js "excuse me"  ${colors.dim}# Lookup by English definition / notes (case-insensitive)${colors.reset}
`);
}

/**
 * Main execution function.
 */
function main() {
  const queryArg = process.argv[2];

  if (!queryArg) {
    showUsage();
    process.exit(0);
  }

  const query = queryArg.trim();
  if (query === "") {
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

  let dictionary;
  try {
    dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  } catch (err) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse dictionary database:${colors.reset} ${err.message}`,
    );
    process.exit(1);
  }

  // Determine query type
  const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(query);
  const hasDigits = /\d/.test(query);

  let matches = [];

  if (hasChinese) {
    // 1. Chinese characters lookup (partial or exact)
    matches = dictionary.filter((entry) => entry.char.includes(query));
  } else if (hasDigits) {
    // 2. Jyutping lookup (case-insensitive, whitespace-independent)
    const normalizedQuery = query.toLowerCase().replace(/[- ]/g, "");
    matches = dictionary.filter((entry) => {
      const normalizedJp = entry.jyutping.toLowerCase().replace(/[- ]/g, "");
      return normalizedJp.includes(normalizedQuery);
    });
  } else {
    // 3. English lookup (case-insensitive, substring search in definition or notes)
    // Or plain alphabetical Jyutping lookup without tone numbers (e.g. "mgoi")
    const lowerQuery = query.toLowerCase();

    // Check definitions and notes
    const englishMatches = dictionary.filter((entry) => {
      const defMatch = entry.definition.toLowerCase().includes(lowerQuery);
      const noteMatch = entry.notes
        ? entry.notes.toLowerCase().includes(lowerQuery)
        : false;
      return defMatch || noteMatch;
    });

    // Check toneless Jyutping matches (e.g., query "mgoi" matches "m4goi1")
    const tonelessMatches = dictionary.filter((entry) => {
      const tonelessJp = entry.jyutping
        .toLowerCase()
        .replace(/[1-6]/g, "")
        .replace(/[- ]/g, "");
      const normalizedQuery = lowerQuery.replace(/[- ]/g, "");
      return (
        tonelessJp === normalizedQuery || tonelessJp.includes(normalizedQuery)
      );
    });

    // Combine and deduplicate matches
    const combined = [...englishMatches];
    for (const entry of tonelessMatches) {
      if (
        !combined.some(
          (e) => e.char === entry.char && e.jyutping === entry.jyutping,
        )
      ) {
        combined.push(entry);
      }
    }
    matches = combined;
  }

  // Display results
  console.log(
    `🔍 ${colors.bold}Query:${colors.reset} "${colors.cyan}${query}${colors.reset}"`,
  );

  if (matches.length === 0) {
    console.log(`\n${colors.yellow}No matching entries found.${colors.reset}`);
    console.log(
      `${colors.dim}Tip: Try searching for characters like "食", Jyutping like "sik6", or definitions like "eat".${colors.reset}\n`,
    );
    process.exit(0);
  }

  const matchCount = matches.length;
  console.log(
    `${colors.dim}Found ${matchCount} matching ${matchCount === 1 ? "entry" : "entries"}:${colors.reset}\n`,
  );

  for (const entry of matches) {
    // Format word type label beautifully
    const typeLabel = entry.type
      ? `${colors.magenta}${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}${colors.reset}`
      : "Word";

    console.log(
      `  ✨ ${colors.green}${colors.bold}${entry.char}${colors.reset} (${colors.yellow}${entry.jyutping}${colors.reset}) — ${typeLabel}`,
    );
    console.log(
      `     ${colors.bold}• Definition:${colors.reset} ${entry.definition}`,
    );

    if (entry.notes) {
      console.log(
        `     ${colors.bold}• Notes:${colors.reset}      ${colors.dim}${entry.notes}${colors.reset}`,
      );
    }
    console.log("");
  }
}

if (require.main === module) {
  main();
}
