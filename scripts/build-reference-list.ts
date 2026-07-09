import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { parseLexicon } from "./lib/lexicon-utils";

const CIFU_URL =
  "https://raw.githubusercontent.com/gwinterstein/Cifu/master/Lexicon/Cifu-v1.txt";
const OUTPUT_PATH = path.join(__dirname, "../content/reference_top1000.json");

console.log("📥 Downloading Cifu frequency lexicon...");

https
  .get(CIFU_URL, (res: import("http").IncomingMessage) => {
    if (res.statusCode !== 200) {
      console.error(
        `❌ Failed to download Cifu database: Status Code ${res.statusCode}`,
      );
      process.exit(1);
    }

    let data = "";
    res.on("data", (chunk: Buffer) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("✅ Download complete. Parsing lexicon...");
      parseAndSave(data);
    });
  })
  .on("error", (err: Error) => {
    console.error(`❌ Network error downloading database: ${err.message}`);
    process.exit(1);
  });

function parseAndSave(rawText: string) {
  const uniqueEntries = parseLexicon(rawText);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueEntries, null, 2), "utf8");
  console.log(
    `🎉 Success! Saved the top ${uniqueEntries.length} most common spoken Cantonese words to "${OUTPUT_PATH}"`,
  );
}

export {};
