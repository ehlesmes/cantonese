import * as fs from "fs";
import * as path from "path";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
};

const versionPath = path.resolve(__dirname, "../public/version.json");
const version = Date.now().toString();

try {
  fs.writeFileSync(versionPath, JSON.stringify({ version }, null, 2), "utf8");
  console.log(
    `${colors.green}${colors.bold}✔ Build version generated: ${version}${colors.reset}`,
  );
} catch (error) {
  console.error("Failed to generate version file:", error);
  process.exit(1);
}

export {};
